export default function ErrorMessage({ error }) {
    if (!error) return null;

    return (
        <div className="bg-danger-subtle text-danger p-2 my-2 rounded">
                <p className="m-0 text-sm">{error}</p>
        </div>
    )
}