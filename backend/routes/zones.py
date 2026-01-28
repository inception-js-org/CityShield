from fastapi import APIRouter, HTTPException
from psycopg2 import pool
import os

router = APIRouter()

pg_pool = pool.SimpleConnectionPool(
    minconn=1,
    maxconn=5,
    dsn=os.getenv("DATABASE_URL"),
)

@router.get("/zones")
def get_zones():
    conn = None
    try:
        conn = pg_pool.getconn()
        cur = conn.cursor()

        cur.execute(
            """
            SELECT name, type, coords
            FROM "Zone"
            ORDER BY name
            LIMIT 30;
            """
        )

        rows = cur.fetchall()

        return [
            {
                "name": row[0],
                "type": row[1],
                "coords": row[2],
            }
            for row in rows
        ]

    except Exception as e:
        print("Zones API error:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch zones")

    finally:
        if conn:
            pg_pool.putconn(conn)
