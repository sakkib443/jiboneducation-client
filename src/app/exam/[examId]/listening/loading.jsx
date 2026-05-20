import ExamLoadingOverlay from "@/components/ExamLoadingOverlay";

// Next.js automatically renders this during route transitions.
// This means the 0-100% progress bar appears IMMEDIATELY when the user
// clicks "Skip" / "Continue" on the instruction video — no blank-screen gap
// while the new page chunk loads.
export default function Loading() {
    return (
        <ExamLoadingOverlay
            active={true}
            done={false}
            label="Preparing Listening Test"
            subLabel="Loading questions and audio..."
        />
    );
}
