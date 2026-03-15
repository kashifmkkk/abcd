import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { validateSpec } from "@/lib/validators/specValidator";
import { apiError, apiOk } from "@/lib/api/errors";

const LayoutItemSchema = z.object({
  i: z.string().min(1),
  x: z.number().int().nonnegative(),
  y: z.number().int().nonnegative(),
  w: z.number().int().positive(),
  h: z.number().int().positive(),
  minW: z.number().optional(),
  minH: z.number().optional(),
});

const PutLayoutSchema = z.object({
  layout: z.object({
    columns: z.number().int().positive(),
    items: z.array(LayoutItemSchema),
  }),
});

interface Params {
  params: Promise<{ projectId: string }>;
}

export async function PUT(req: Request, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) return apiError(401, "UNAUTHORIZED", "Unauthorized");

  const { projectId } = await params;

  let parsedBody: z.infer<typeof PutLayoutSchema>;
  try {
    const body = await req.json();
    const parsed = PutLayoutSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(400, "BAD_REQUEST", "Invalid layout payload", parsed.error.issues);
    }
    parsedBody = parsed.data;
  } catch (error) {
    return apiError(400, "INVALID_JSON", "Invalid JSON body", error);
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true, specJson: true },
  });

  if (!project) return apiError(404, "NOT_FOUND", "Project not found");

  let spec;
  try {
    spec = validateSpec(project.specJson);
  } catch (error) {
    return apiError(422, "INVALID_SPEC", "Invalid project spec", error);
  }

  const widgetIds = new Set(spec.widgets.map((widget) => widget.id));
  const hasUnknownWidget = parsedBody.layout.items.some((item) => !widgetIds.has(item.i));
  if (hasUnknownWidget) {
    return apiError(422, "BAD_REQUEST", "Layout contains unknown widget IDs");
  }

  const nextSpec = {
    ...spec,
    layout: parsedBody.layout,
  };

  await prisma.project.update({
    where: { id: projectId },
    data: {
      specJson: nextSpec as unknown as object,
    },
  });

  return apiOk({ saved: true, layout: parsedBody.layout });
}
