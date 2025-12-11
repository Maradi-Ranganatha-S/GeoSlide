import os

# --- SETTINGS ---
# "." means "current folder" (where this script is saved).
# You can change this to a specific path like "C:/Users/You/Desktop/Landslides_post"
folder_path = "." 

# What to find and what to replace
search_text = "image"
replace_text = "post"

def rename_images():
    count = 0
    # Loop through all files in the folder
    for filename in os.listdir(folder_path):
        
        # Check if the filename contains the search text (e.g., "image")
        if search_text in filename:
            
            # Create the new name
            new_filename = filename.replace(search_text, replace_text)
            
            # Get full paths
            old_file = os.path.join(folder_path, filename)
            new_file = os.path.join(folder_path, new_filename)
            
            # Rename
            try:
                os.rename(old_file, new_file)
                print(f"✅ Renamed: {filename}  --->  {new_filename}")
                count += 1
            except Exception as e:
                print(f"❌ Error renaming {filename}: {e}")

    if count == 0:
        print("No files found with the name '" + search_text + "'")
    else:
        print(f"\nSuccessfully renamed {count} files!")

# Run the function
rename_images()