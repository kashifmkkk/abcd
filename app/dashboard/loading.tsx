import { DashboardAIWorkspace } from "@/components/workspace/DashboardAIWorkspace";
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";

export default function DashboardListLoading() {
  return (
    <WorkspaceLayout kind="dashboard" projects={[]}>
      <DashboardAIWorkspace projects={[]} projectsLoading />
    </WorkspaceLayout>
  );
}
