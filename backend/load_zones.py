import json
import psycopg2

# 1. Load JSON file
with open("zones.json", "r", encoding="utf-8") as f:
    payload = json.load(f)

meta = payload["meta"]
zones = payload["zones"]

# 2. Connect to Neon
conn = psycopg2.connect(
    "postgresql://neondb_owner:npg_F0EgsJ6yKuUT@ep-young-breeze-ah4yn303-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
)

cur = conn.cursor()

# 3. Insert meta
cur.execute(
    """
    INSERT INTO zones_meta (city, coordinate_order, generated_by, date_created)
    VALUES (%s, %s, %s, %s)
    """,
    (
        meta["city"],
        meta["coordinate_order"],
        meta["generated_by"],
        meta["date_created"]
    )
)

# 4. Insert zones
for z in zones:
    cur.execute(
        """
        INSERT INTO zones (
            zone_id, name, type,
            pop_density, crowd_base, lighting,
            cctv_density, police_score, patrol_freq,
            risk_base, coords, base_crime_rates
        )
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """,
        (
            z["zone_id"],
            z["name"],
            z["type"],
            z["pop_density"],
            z["crowd_base"],
            z["lighting"],
            z["cctv_density"],
            z["police_score"],
            z["patrol_freq"],
            z["risk_base"],
            json.dumps(z["coords"]),
            json.dumps(z["base_crime_rates"])
        )
    )

conn.commit()
cur.close()
conn.close()

print("✅ Zones successfully loaded into Neon")
