export default function Logo({ className = "", size = "default" }) {
    const heightClass = size === "small" ? "h-8" : size === "large" ? "h-14" : "h-10";

    return (
        <div className={`flex items-center ${className}`}>
            <img
                src="/images/IMG_5177.PNG"
                alt="Jibon Education - An English Language Training Centre"
                className={`${heightClass} object-contain`}
            />
        </div>
    );
}
