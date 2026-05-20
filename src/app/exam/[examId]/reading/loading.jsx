import ExamLoadingOverlay from "@/components/ExamLoadingOverlay";

// Shown automatically by Next.js while the reading route's chunk is loading
// after the user clicks "Skip" / "Continue" on the instruction video.
export default function Loading() {
    return (
        <ExamLoadingOverlay
            active={true}
            done={false}
            label="Preparing Reading Test"
            subLabel="Loading passages and questions..."
        />
    );
}
