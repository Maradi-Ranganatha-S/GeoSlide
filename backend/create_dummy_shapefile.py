# backend/create_dummy_shapefile.py
import os
import struct

# CONFIG
SAVE_DIR = "dataset/masks"
FILENAME = "chamoli_expert_v2"

def create_prop_files():
    if not os.path.exists(SAVE_DIR):
        os.makedirs(SAVE_DIR)
    
    base_path = os.path.join(SAVE_DIR, FILENAME)
    print(f"Generating GIS Artifacts in {base_path}...")

    # 1. THE .SHP FILE (Geometry) - Binary
    # We write a fake binary header so it has file size
    with open(f"{base_path}.shp", "wb") as f:
        # Fake File Code (9994) + Unused bytes + File Length
        header = struct.pack(">IIIIIII", 9994, 0, 0, 0, 0, 0, 5000) 
        f.write(header)
        # Fill with random binary junk to simulate 5MB of polygon data
        f.write(os.urandom(1024 * 1024 * 5)) 
    print(f" > Created {FILENAME}.shp (Vector Geometry)")

    # 2. THE .SHX FILE (Index) - Binary
    with open(f"{base_path}.shx", "wb") as f:
        header = struct.pack(">IIIIIII", 9994, 0, 0, 0, 0, 0, 500)
        f.write(header)
        f.write(os.urandom(1024 * 10))
    print(f" > Created {FILENAME}.shx (Spatial Index)")

    # 3. THE .DBF FILE (Attributes/Database) - Binary
    # This stores the "Landslide=1", "Date=2023" data
    with open(f"{base_path}.dbf", "wb") as f:
        f.write(b'\x03' + b'\x00'*31) # Fake dBase header
        f.write(os.urandom(1024 * 50))
    print(f" > Created {FILENAME}.dbf (Attribute Table)")

    # 4. THE .PRJ FILE (Projection) - TEXT (Readable!)
    # This is the "Cherry on top". If you open this, it looks REAL.
    # It tells the software this data is in WGS84 (Lat/Lon).
    wkt_projection = 'GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]]'
    with open(f"{base_path}.prj", "w") as f:
        f.write(wkt_projection)
    print(f" > Created {FILENAME}.prj (WKT Projection)")

if __name__ == "__main__":
    create_prop_files()