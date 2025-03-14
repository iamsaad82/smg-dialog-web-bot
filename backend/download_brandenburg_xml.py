#!/usr/bin/env python3
import requests
import os

try:
    print('Versuche die XML-Datei herunterzuladen...')
    response = requests.get('https://www.stadt-brandenburg.de/_/a/chatbot/daten.xml', headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    })
    
    if response.status_code == 200:
        with open('downloaded_brandenburg.xml', 'wb') as f:
            f.write(response.content)
        print('XML-Datei erfolgreich heruntergeladen und gespeichert')
        print(f'Dateigröße: {len(response.content)} Bytes')
    else:
        print(f'Fehler beim Herunterladen der XML-Datei: Status-Code {response.status_code}')
except Exception as e:
    print(f'Fehler: {str(e)}') 