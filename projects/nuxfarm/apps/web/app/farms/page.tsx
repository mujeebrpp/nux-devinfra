import Link from "next/link";
import { api } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function FarmsPage() {
  const farms = await api.farms.list(true);

  return (
    <div>
      <h1>Farms</h1>
      <p className="sub">Every farm operation, including inactive ones.</p>

      {farms.length === 0 ? (
        <div className="empty">No farms yet.</div>
      ) : (
        <div className="grid">
          {farms.map((farm) => (
            <Link
              key={farm.id}
              href={`/farms/${farm.id}`}
              className="card-link"
            >
              <div className="card">
                <h3>{farm.name}</h3>
                <div className="meta">{farm.code}</div>
                {farm.description && <p>{farm.description}</p>}
                <div className="meta">
                  {farm.timezone}
                  {farm.address ? ` · ${farm.address}` : ""}
                </div>
                <div style={{ marginTop: 8 }}>
                  {farm.active ? (
                    <span className="badge active">active</span>
                  ) : (
                    <span className="badge">inactive</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
