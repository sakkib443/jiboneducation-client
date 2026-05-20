import ExamLoadingOverlay from "@/components/ExamLoadingOverlay";

// Shown automatically by Next.js while the writing route's chunk is loading.
export default function Loading() {
    return (
        <ExamLoadingOverlay
            active={true}
            done={false}
            label="Preparing Writing Test"
            subLabel="Loading tasks..."
        />
    );
}
