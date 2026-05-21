export default function Logo({ className = "", size = "default" }) {
    const heightClass = size === "small" ? "h-7" : size === "large" ? "h-12 sm:h-14" : "h-8 sm:h-10";

    return (
        <div className={`flex items-center ${className}`}>
            <img
                src="/images/logo.png"
                alt="Jibon Education - An English Language Training Centre"
                className={`${heightClass} object-contain`}
            />
        </div>
    );
}
