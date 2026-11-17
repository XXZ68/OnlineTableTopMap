import { useEffect, useState, type CSSProperties } from "react";
import { getImageUrl } from "../../utils/imageUrl";

type Props = {
    value: string | null;
    onChange: (path: string | null) => void;
};

export default function TokenImagePicker({ value, onChange }: Props) {
    const [images, setImages] = useState<string[]>([]);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/Character/token-images`, {
            credentials: "include",
        })
            .then((r) => r.json())
            .then((data: string[]) => setImages(data))
            .catch(() => setImages([]));
    }, []);

    const tile = (selected: boolean): CSSProperties => ({
        width: 56,
        height: 56,
        borderRadius: "50%",
        objectFit: "cover",
        cursor: "pointer",
        border: selected ? "3px solid #f59e0b" : "2px solid #444",
        background: "#222",
    });

    return (
        <div className="flex flex-wrap gap-2">
            <div
                onClick={() => onChange(null)}
                style={{
                    ...tile(value === null),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#aaa",
                    fontSize: 11,
                }}
            >
                None
            </div>

            {images.map((path) => (
                <img
                    key={path}
                    src={getImageUrl(path)}
                    alt=""
                    style={tile(value === path)}
                    onClick={() => onChange(path)}
                />
            ))}
        </div>
    );
}