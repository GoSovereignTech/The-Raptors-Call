import { EdgeTTS } from '@andresaya/edge-tts';
import fs from 'fs';
import path from 'path';
/*
faves
block 6 byr faster
 block 7
 block 13
 block 17 ng
 block 20 
  block 21 
   block 22 
   block 27 
   - 30 emma multilingual neural
   block 31 eric neural  
    block 33
    block 34  michelle neural 
*/
async function generateFromCSV() {
    // 1. Read the CSV file
    const csvPath = path.join(process.cwd(), 'tts-scripts', 'stories.csv');
    
    if (!fs.existsSync(csvPath)) {
        console.error(`❌ Could not find ${csvPath}. Make sure the file exists!`);
        return;
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');
    
    // 2. Create an output folder for the MP3s
    const outputDir = path.join(process.cwd(), 'tts-scripts', 'output');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    console.log(`🎬 Found ${lines.length} lines in CSV. Starting generation...\n`);

    // 3. Loop through each line
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines

        // Split only on the FIRST comma
        const firstCommaIndex = line.indexOf(',');
        if (firstCommaIndex === -1) {
            console.warn(`⚠️ Line ${i + 1} is missing a comma. Skipping.`);
            continue;
        }

        const voice = line.substring(0, firstCommaIndex).trim();
        let text = line.substring(firstCommaIndex + 1).trim();

        // Remove surrounding quotes from the text if they exist
        if (text.startsWith('"') && text.endsWith('"')) {
            text = text.slice(1, -1);
        }

        const filename = `block-${String(i + 1).padStart(2, '0')}.mp3`;
        const outputPath = path.join(outputDir, filename);

        try {
            console.log(`🎙️ Block ${i + 1} [${voice}]: "${text.substring(0, 30)}..."`);
            
            const tts = new EdgeTTS();
            await tts.synthesize(text, voice, { rate: '0%', pitch: '0Hz' });
            await tts.toFile(outputPath);
            
            console.log(`✅ Saved: tts-scripts/output/${filename}\n`);
        } catch (error) {
            console.error(`❌ Failed on line ${i + 1}:`, error.message);
        }
    }
    
    console.log('🎉 All done! Check the "tts-scripts/output" folder.');
}

generateFromCSV();

/*

 - ar-DZ-AminaNeural
 - ar-DZ-IsmaelNeural
 - ar-BH-AliNeural
 - ar-BH-LailaNeural
 - ar-EG-SalmaNeural
 - ar-EG-ShakirNeural
 - ar-IQ-BasselNeural
 - ar-IQ-RanaNeural
 - ar-JO-SanaNeural
 - ar-JO-TaimNeural
 - ar-KW-FahedNeural
 - ar-KW-NouraNeural
 - ar-LB-LaylaNeural
 - ar-LB-RamiNeural
 - ar-LY-ImanNeural
 - ar-LY-OmarNeural
 - ar-MA-JamalNeural
 - ar-MA-MounaNeural
 - ar-OM-AbdullahNeural
 - ar-OM-AyshaNeural
 - ar-QA-AmalNeural
 - ar-QA-MoazNeural
 - ar-SA-HamedNeural
 - ar-SA-ZariyahNeural
 - ar-SY-AmanyNeural
 - ar-SY-LaithNeural
 - ar-TN-HediNeural
 - ar-TN-ReemNeural
 - ar-AE-FatimaNeural
 - ar-AE-HamdanNeural
 - ar-YE-MaryamNeural
 - ar-YE-SalehNeural
 - az-AZ-BabekNeural
 - az-AZ-BanuNeural
 - bn-BD-NabanitaNeural
 - bn-BD-PradeepNeural
 - bn-IN-BashkarNeural
 - bn-IN-TanishaaNeural
 - bs-BA-VesnaNeural
 - bs-BA-GoranNeural
 - bg-BG-BorislavNeural
 - bg-BG-KalinaNeural
 - my-MM-NilarNeural
 - my-MM-ThihaNeural
 - ca-ES-EnricNeural
 - ca-ES-JoanaNeural
 - zh-HK-HiuGaaiNeural
 - zh-HK-HiuMaanNeural
 - zh-HK-WanLungNeural
 - zh-CN-XiaoxiaoNeural
 - zh-CN-XiaoyiNeural
 - zh-CN-YunjianNeural
 - zh-CN-YunxiNeural
 - zh-CN-YunxiaNeural
 - zh-CN-YunyangNeural
 - zh-CN-liaoning-XiaobeiNeural
 - zh-TW-HsiaoChenNeural
 - zh-TW-YunJheNeural
 - zh-TW-HsiaoYuNeural
 - zh-CN-shaanxi-XiaoniNeural
 - hr-HR-GabrijelaNeural
 - hr-HR-SreckoNeural
 - cs-CZ-AntoninNeural
 - cs-CZ-VlastaNeural
 - da-DK-ChristelNeural
 - da-DK-JeppeNeural
 - nl-BE-ArnaudNeural
 - nl-BE-DenaNeural
 - nl-NL-ColetteNeural
 - nl-NL-FennaNeural
 - nl-NL-MaartenNeural
 - en-AU-WilliamMultilingualNeural
 - en-AU-NatashaNeural

 - en-CA-ClaraNeural
 - en-CA-LiamNeural
 - en-HK-YanNeural
 - en-HK-SamNeural

 - en-IN-NeerjaExpressiveNeural
 - en-IN-NeerjaNeural
 - en-IN-PrabhatNeural
 - en-IE-ConnorNeural
 - en-IE-EmilyNeural
 - en-KE-AsiliaNeural
 - en-KE-ChilembaNeural
 - en-NZ-MitchellNeural
 - en-NZ-MollyNeural
 - en-NG-AbeoNeural
 - en-NG-EzinneNeural
 - en-PH-JamesNeural
 - en-PH-RosaNeural
 - en-US-AvaNeural
 - en-US-AndrewNeural
 - en-US-EmmaNeural
 - en-US-BrianNeural
 - en-SG-LunaNeural
 - en-SG-WayneNeural
 - en-ZA-LeahNeural
 - en-ZA-LukeNeural
 - en-TZ-ElimuNeural
 - en-TZ-ImaniNeural
 - en-GB-LibbyNeural
 - en-GB-MaisieNeural
 - en-GB-RyanNeural
 - en-GB-SoniaNeural
 - en-GB-ThomasNeural

 - en-US-AnaNeural
 - en-US-AndrewMultilingualNeural
 - en-US-AriaNeural
 - en-US-AvaMultilingualNeural
 - en-US-BrianMultilingualNeural
 - en-US-ChristopherNeural
 - en-US-EmmaMultilingualNeural
 - en-US-EricNeural
 - en-US-GuyNeural
 - en-US-JennyNeural
 - en-US-MichelleNeural
 - en-US-RogerNeural
 - en-US-SteffanNeural
 - et-EE-AnuNeural
 - et-EE-KertNeural
 - fil-PH-AngeloNeural
 - fil-PH-BlessicaNeural
 - fi-FI-HarriNeural
 - fi-FI-NooraNeural
 - fr-BE-CharlineNeural
 - fr-BE-GerardNeural
 - fr-CA-ThierryNeural
 - fr-CA-AntoineNeural
 - fr-CA-JeanNeural
 - fr-CA-SylvieNeural
 - fr-FR-VivienneMultilingualNeural
 - fr-FR-RemyMultilingualNeural
 - fr-FR-DeniseNeural
 - fr-FR-EloiseNeural
 - fr-FR-HenriNeural
 - fr-CH-ArianeNeural
 - fr-CH-FabriceNeural
 - gl-ES-RoiNeural
 - gl-ES-SabelaNeural
 - ka-GE-EkaNeural
 - ka-GE-GiorgiNeural
 - de-AT-IngridNeural
 - de-AT-JonasNeural
 - de-DE-SeraphinaMultilingualNeural
 - de-DE-FlorianMultilingualNeural
 - de-DE-AmalaNeural
 - de-DE-ConradNeural
 - de-DE-KatjaNeural
 - de-DE-KillianNeural
 - de-CH-JanNeural
 - de-CH-LeniNeural
 - el-GR-AthinaNeural
 - el-GR-NestorasNeural
 - gu-IN-DhwaniNeural
 - gu-IN-NiranjanNeural
 - he-IL-AvriNeural
 - he-IL-HilaNeural
 - hi-IN-MadhurNeural
 - hi-IN-SwaraNeural
 - hu-HU-NoemiNeural
 - hu-HU-TamasNeural
 - is-IS-GudrunNeural
 - is-IS-GunnarNeural
 - id-ID-ArdiNeural
 - id-ID-GadisNeural
 - iu-Latn-CA-SiqiniqNeural
 - iu-Latn-CA-TaqqiqNeural
 - iu-Cans-CA-SiqiniqNeural
 - iu-Cans-CA-TaqqiqNeural
 - ga-IE-ColmNeural
 - ga-IE-OrlaNeural
 - it-IT-GiuseppeMultilingualNeural
 - it-IT-DiegoNeural
 - it-IT-ElsaNeural
 - it-IT-IsabellaNeural
 - ja-JP-KeitaNeural
 - ja-JP-NanamiNeural
 - jv-ID-DimasNeural
 - jv-ID-SitiNeural
 - kn-IN-GaganNeural
 - kn-IN-SapnaNeural
 - kk-KZ-AigulNeural
 - kk-KZ-DauletNeural
 - km-KH-PisethNeural
 - km-KH-SreymomNeural
 - ko-KR-HyunsuMultilingualNeural
 - ko-KR-InJoonNeural
 - ko-KR-SunHiNeural
 - lo-LA-ChanthavongNeural
 - lo-LA-KeomanyNeural
 - lv-LV-EveritaNeural
 - lv-LV-NilsNeural
 - lt-LT-LeonasNeural
 - lt-LT-OnaNeural
 - mk-MK-AleksandarNeural
 - mk-MK-MarijaNeural
 - ms-MY-OsmanNeural
 - ms-MY-YasminNeural
 - ml-IN-MidhunNeural
 - ml-IN-SobhanaNeural
 - mt-MT-GraceNeural
 - mt-MT-JosephNeural
 - mr-IN-AarohiNeural
 - mr-IN-ManoharNeural
 - mn-MN-BataaNeural
 - mn-MN-YesuiNeural
 - ne-NP-HemkalaNeural
 - ne-NP-SagarNeural
 - nb-NO-FinnNeural
 - nb-NO-PernilleNeural
 - ps-AF-GulNawazNeural
 - ps-AF-LatifaNeural
 - fa-IR-DilaraNeural
 - fa-IR-FaridNeural
 - pl-PL-MarekNeural
 - pl-PL-ZofiaNeural
 - pt-BR-ThalitaMultilingualNeural
 - pt-BR-AntonioNeural
 - pt-BR-FranciscaNeural
 - pt-PT-DuarteNeural
 - pt-PT-RaquelNeural
 - ro-RO-AlinaNeural
 - ro-RO-EmilNeural
 - ru-RU-DmitryNeural
 - ru-RU-SvetlanaNeural
 - sr-RS-NicholasNeural
 - sr-RS-SophieNeural
 - si-LK-SameeraNeural
 - si-LK-ThiliniNeural
 - sk-SK-LukasNeural
 - sk-SK-ViktoriaNeural
 - sl-SI-PetraNeural
 - sl-SI-RokNeural
 - so-SO-MuuseNeural
 - so-SO-UbaxNeural
 - es-AR-ElenaNeural
 - es-AR-TomasNeural
 - es-BO-MarceloNeural
 - es-BO-SofiaNeural
 - es-CL-CatalinaNeural
 - es-CL-LorenzoNeural
 - es-CO-GonzaloNeural
 - es-CO-SalomeNeural
 - es-ES-XimenaNeural
 - es-CR-JuanNeural
 - es-CR-MariaNeural
 - es-CU-BelkysNeural
 - es-CU-ManuelNeural
 - es-DO-EmilioNeural
 - es-DO-RamonaNeural
 - es-EC-AndreaNeural
 - es-EC-LuisNeural
 - es-SV-LorenaNeural
 - es-SV-RodrigoNeural
 - es-GQ-JavierNeural
 - es-GQ-TeresaNeural
 - es-GT-AndresNeural
 - es-GT-MartaNeural
 - es-HN-CarlosNeural
 - es-HN-KarlaNeural
 - es-MX-DaliaNeural
 - es-MX-JorgeNeural
 - es-NI-FedericoNeural
 - es-NI-YolandaNeural
 - es-PA-MargaritaNeural
 - es-PA-RobertoNeural
 - es-PY-MarioNeural
 - es-PY-TaniaNeural
 - es-PE-AlexNeural
 - es-PE-CamilaNeural
 - es-PR-KarinaNeural
 - es-PR-VictorNeural
 - es-ES-AlvaroNeural
 - es-ES-ElviraNeural
 - es-US-AlonsoNeural
 - es-US-PalomaNeural
 - es-UY-MateoNeural
 - es-UY-ValentinaNeural
 - es-VE-PaolaNeural
 - es-VE-SebastianNeural
 - su-ID-JajangNeural
 - su-ID-TutiNeural
 - sw-KE-RafikiNeural
 - sw-KE-ZuriNeural
 - sw-TZ-DaudiNeural
 - sw-TZ-RehemaNeural
 - sv-SE-MattiasNeural
 - sv-SE-SofieNeural
 - ta-IN-PallaviNeural
 - ta-IN-ValluvarNeural
 - ta-MY-KaniNeural
 - ta-MY-SuryaNeural
 - ta-SG-AnbuNeural
 - ta-SG-VenbaNeural
 - ta-LK-KumarNeural
 - ta-LK-SaranyaNeural
 - te-IN-MohanNeural
 - te-IN-ShrutiNeural
 - th-TH-NiwatNeural
 - th-TH-PremwadeeNeural
 - tr-TR-EmelNeural
 - tr-TR-AhmetNeural
 - uk-UA-OstapNeural
 - uk-UA-PolinaNeural
 - ur-IN-GulNeural
 - ur-IN-SalmanNeural
 - ur-PK-AsadNeural
 - ur-PK-UzmaNeural
 - uz-UZ-MadinaNeural
 - uz-UZ-SardorNeural
 - vi-VN-HoaiMyNeural
 - vi-VN-NamMinhNeural
 - cy-GB-AledNeural
 - cy-GB-NiaNeural
 - zu-ZA-ThandoNeural
 - zu-ZA-ThembaNeural
*/