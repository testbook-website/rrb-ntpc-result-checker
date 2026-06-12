import os
import pypdf
import re
import json

def extract_all_roll_numbers():
    workspace_dir = os.path.dirname(os.path.abspath(__file__))
    pdf_files = [f for f in os.listdir(workspace_dir) if f.lower().endswith('.pdf')]
    
    data = {}
    print(f"Found {len(pdf_files)} PDF result files to process.")
    
    for filename in sorted(pdf_files):
        # The Zone is the name of the file without the .pdf extension
        zone = os.path.splitext(filename)[0]
        filepath = os.path.join(workspace_dir, filename)
        
        print(f"Processing zone: {zone} ({filename})...")
        reader = pypdf.PdfReader(filepath)
        zone_rolls = []
        
        for page_num, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            # Match exactly 16-digit numbers
            matches = re.findall(r'\b\d{16}\b', text)
            zone_rolls.extend(matches)
        
        # Deduplicate and sort
        unique_rolls = sorted(list(set(zone_rolls)))
        data[zone] = unique_rolls
        print(f"Successfully processed {zone}: found {len(unique_rolls)} unique qualified roll numbers.")
    
    # Create the data folder if it doesn't exist
    data_dir = os.path.join(workspace_dir, 'data')
    os.makedirs(data_dir, exist_ok=True)
    
    output_filepath = os.path.join(data_dir, 'roll_numbers.json')
    with open(output_filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
        
    print(f"\nAll roll numbers written successfully to: {output_filepath}")
    total_all_zones = sum(len(rolls) for rolls in data.values())
    print(f"Total compiled qualified roll numbers across all zones: {total_all_zones}")

if __name__ == "__main__":
    extract_all_roll_numbers()
