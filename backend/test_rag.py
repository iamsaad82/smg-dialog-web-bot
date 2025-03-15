import asyncio
from app.services.rag_service import rag_service

async def test_schulen():
    result = await rag_service.get_structured_data_for_query("9d8d5dcf-f6b3-4d06-8016-0f24869f8872", "Welche Schulen gibt es in Brandenburg an der Havel?")
    print(f"Strukturierte Daten (Schulen): {len(result)}")
    if result:
        print([item["type"] for item in result])
    else:
        print("Keine strukturierten Daten gefunden")
    return result

async def test_aemter():
    result = await rag_service.get_structured_data_for_query("9d8d5dcf-f6b3-4d06-8016-0f24869f8872", "Wo sind die Ämter in Brandenburg an der Havel?")
    print(f"Strukturierte Daten (Ämter): {len(result)}")
    if result:
        print([item["type"] for item in result])
    else:
        print("Keine strukturierten Daten gefunden")
    return result

async def test_veranstaltungen():
    result = await rag_service.get_structured_data_for_query("9d8d5dcf-f6b3-4d06-8016-0f24869f8872", "Welche Veranstaltungen gibt es in Brandenburg an der Havel?")
    print(f"Strukturierte Daten (Veranstaltungen): {len(result)}")
    if result:
        print([item["type"] for item in result])
    else:
        print("Keine strukturierten Daten gefunden")
    return result

if __name__ == "__main__":
    print("===== Test für Schulen =====")
    asyncio.run(test_schulen())
    
    print("\n===== Test für Ämter =====")
    asyncio.run(test_aemter())
    
    print("\n===== Test für Veranstaltungen =====")
    asyncio.run(test_veranstaltungen()) 