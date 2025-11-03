export default function ErrorBanner({ message }: { message?: string | null }) {
    if (!message) return null;
    return (
        <div style={{
            marginTop: 12, padding: 12, border: "1px solid #f5c2c7",
            background: "#f8d7da", color: "#842029", borderRadius: 8
        }}>
            {`Error: ${message}`}
        </div>
    );
}
