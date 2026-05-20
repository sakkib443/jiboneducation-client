import ExamLoadingOverlay from "@/components/ExamLoadingOverlay";

export default function Loading() {
    return (
        <ExamLoadingOverlay
            active={true}
            done={false}
            label="Preparing Full Exam"
            subLabel="Loading exam modules..."
        />
    );
}
