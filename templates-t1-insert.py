#!/usr/bin/env python3
# T-tr-1: insert "templates" i18n section (30 keys) into hi/mr/bn/ta/te/kn.json
# Pattern proven in A-2: text-splice insertion before the "languageNames" line,
# so all existing bytes stay untouched. Idempotent (skips files that already have it).
import json, sys, os

ROOT = "/home/z/my-project/src/i18n/locales"
ANCHOR = '  "languageNames": {'

T = {}

T["hi"] = {
    "title": "मैसेज टेम्पलेट",
    "desc": "अपने व्हाट्सएप मैसेज सेव करें। कोई भी लीड खोलें, टेम्पलेट दबाएं और मैसेज तुरंत भेजने को तैयार हो जाएगा।",
    "add": "टेम्पलेट जोड़ें",
    "edit": "टेम्पलेट संपादित करें",
    "name": "टेम्पलेट का नाम",
    "namePh": "जैसे: पहला संपर्क",
    "content": "मैसेज",
    "contentPh": "अपना मैसेज यहां लिखें...",
    "insertVar": "जोड़ने के लिए दबाएं",
    "makeDefault": "डिफ़ॉल्ट बनाएं",
    "defaultDesc": "लीड खोलते ही यह मैसेज अपने आप खुल जाएगा",
    "defaultBadge": "डिफ़ॉल्ट",
    "noTemplates": "अभी कोई टेम्पलेट नहीं",
    "noTemplatesDesc": "पहला मैसेज टेम्पलेट सेव करें और व्हाट्सएप फॉलो-अप एक ही दबाने में भेजें",
    "preview": "झलक",
    "useHint": "कोई भी लीड खोलें, टेम्पलेट दबाएं - मैसेज व्हाट्सएप पर भेजने को तैयार खुल जाएगा",
    "emptyName": "टेम्पलेट का नाम लिखें",
    "emptyContent": "मैसेज लिखें",
    "confirmDelete": "क्या आप वाकई यह टेम्पलेट हटाना चाहते हैं?",
    "varName": "{name} - ग्राहक का नाम",
    "varCompany": "{company} - कंपनी",
    "varCity": "{city} - शहर",
    "varValue": "{value} - सौदे की रकम",
    "varBusiness": "{business} - आपके धंधे का नाम",
    "varDate": "{date} - आज की तारीख",
    "composerTitle": "व्हाट्सएप मैसेज",
    "pickTemplate": "आपके टेम्पलेट",
    "aiGenerate": "एआई से लिखवाएं",
    "sentActivity": "टेम्पलेट से व्हाट्सएप भेजा",
    "sampleName": "नमूना ग्राहक",
}

T["mr"] = {
    "title": "मेसेज टेम्पलेट",
    "desc": "तुमचे स्वतःचे व्हॉट्सअॅप मेसेज सेव्ह करा. कोणतीही लीड उघडा, टेम्पलेट दाबा आणि मेसेज लगेच पाठवायला तयार होईल.",
    "add": "टेम्पलेट जोडा",
    "edit": "टेम्पलेट संपादित करा",
    "name": "टेम्पलेटचे नाव",
    "namePh": "जसे: पहिला संपर्क",
    "content": "मेसेज",
    "contentPh": "तुमचा मेसेज इथे लिहा...",
    "insertVar": "जोडण्यासाठी दाबा",
    "makeDefault": "डीफॉल्ट करा",
    "defaultDesc": "लीड उघडताच हा मेसेज आपोआप उघडेल",
    "defaultBadge": "डीफॉल्ट",
    "noTemplates": "अजून कोणतेही टेम्पलेट नाही",
    "noTemplatesDesc": "पहिला मेसेज टेम्पलेट सेव्ह करा आणि व्हॉट्सअॅप फॉलो-अप एकाच दाबात पाठवा",
    "preview": "झलक",
    "useHint": "कोणतीही लीड उघडा, टेम्पलेट दाबा - मेसेज व्हॉट्सअॅपवर पाठवायला तयार उघडेल",
    "emptyName": "टेम्पलेटचे नाव लिहा",
    "emptyContent": "मेसेज लिहा",
    "confirmDelete": "हे टेम्पलेट हटवायचे आहे का?",
    "varName": "{name} - ग्राहकाचे नाव",
    "varCompany": "{company} - कंपनी",
    "varCity": "{city} - शहर",
    "varValue": "{value} - सौद्याची रक्कम",
    "varBusiness": "{business} - तुमच्या व्यवसायाचे नाव",
    "varDate": "{date} - आजचा दिनांक",
    "composerTitle": "व्हॉट्सअॅप मेसेज",
    "pickTemplate": "तुमचे टेम्पलेट",
    "aiGenerate": "एआयकडून लिहून घ्या",
    "sentActivity": "टेम्पलेट वापरून व्हॉट्सअॅप पाठवला",
    "sampleName": "नमुना ग्राहक",
}

T["bn"] = {
    "title": "বার্তা টেমপ্লেট",
    "desc": "আপনার নিজের হোয়াটসঅ্যাপ বার্তা সংরক্ষণ করুন। যেকোনো লিড খুলুন, টেমপ্লেটে চাপুন এবং বার্তা সাথে সাথে পাঠানোর জন্য তৈরি হয়ে যাবে।",
    "add": "টেমপ্লেট যোগ করুন",
    "edit": "টেমপ্লেট সম্পাদনা করুন",
    "name": "টেমপ্লেটের নাম",
    "namePh": "যেমন: প্রথম যোগাযোগ",
    "content": "বার্তা",
    "contentPh": "আপনার বার্তা এখানে লিখুন...",
    "insertVar": "যোগ করতে চাপুন",
    "makeDefault": "ডিফল্ট করুন",
    "defaultDesc": "লিড খুললেই এই বার্তা নিজে থেকেই খুলবে",
    "defaultBadge": "ডিফল্ট",
    "noTemplates": "এখনো কোনো টেমপ্লেট নেই",
    "noTemplatesDesc": "প্রথম বার্তা টেমপ্লেট সংরক্ষণ করুন এবং হোয়াটসঅ্যাপ ফলো-আপ এক চাপেই পাঠান",
    "preview": "প্রিভিউ",
    "useHint": "যেকোনো লিড খুলুন, টেমপ্লেটে চাপুন - বার্তা হোয়াটসঅ্যাপে পাঠানোর জন্য তৈরি হয়ে খুলবে",
    "emptyName": "টেমপ্লেটের নাম লিখুন",
    "emptyContent": "বার্তা লিখুন",
    "confirmDelete": "আপনি কি এই টেমপ্লেট মুছে ফেলতে চান?",
    "varName": "{name} - গ্রাহকের নাম",
    "varCompany": "{company} - কোম্পানি",
    "varCity": "{city} - শহর",
    "varValue": "{value} - চুক্তির মূল্য",
    "varBusiness": "{business} - আপনার ব্যবসার নাম",
    "varDate": "{date} - আজকের তারিখ",
    "composerTitle": "হোয়াটসঅ্যাপ বার্তা",
    "pickTemplate": "আপনার টেমপ্লেট",
    "aiGenerate": "এআই দিয়ে লিখুন",
    "sentActivity": "টেমপ্লেট দিয়ে হোয়াটসঅ্যাপ পাঠানো হয়েছে",
    "sampleName": "নমুনা গ্রাহক",
}

T["ta"] = {
    "title": "செய்தி டெம்ப்ளேட்",
    "desc": "உங்கள் சொந்த வாட்ஸ்அப் செய்திகளைச் சேமிக்கவும். எந்த லீட்டையும் திறக்கவும், டெம்ப்ளேட்டை அழுத்தவும், செய்தி உடனே அனுப்பத் தயாராகிவிடும்.",
    "add": "டெம்ப்ளேட் சேர்க்கவும்",
    "edit": "டெம்ப்ளேட்டைத் திருத்தவும்",
    "name": "டெம்ப்ளேட் பெயர்",
    "namePh": "எ.கா: முதல் தொடர்பு",
    "content": "செய்தி",
    "contentPh": "உங்கள் செய்தியை இங்கே எழுதுங்கள்...",
    "insertVar": "சேர்க்க அழுத்தவும்",
    "makeDefault": "இயல்புநிலையாக்கவும்",
    "defaultDesc": "லீட்டைத் திறந்ததும் இந்தச் செய்தி தானாகவே திறக்கும்",
    "defaultBadge": "இயல்புநிலை",
    "noTemplates": "இன்னும் டெம்ப்ளேட் இல்லை",
    "noTemplatesDesc": "முதல் செய்தி டெம்ப்ளேட்டைச் சேமித்து, வாட்ஸ்அப் பின்தொடர்தலை ஒரே அழுத்தத்தில் அனுப்புங்கள்",
    "preview": "முன்னோட்டம்",
    "useHint": "எந்த லீட்டையும் திறக்கவும், டெம்ப்ளேட்டை அழுத்தவும் - செய்தி வாட்ஸ்அப்பில் அனுப்பத் தயாராகத் திறக்கும்",
    "emptyName": "டெம்ப்ளேட் பெயரை எழுதுங்கள்",
    "emptyContent": "செய்தியை எழுதுங்கள்",
    "confirmDelete": "இந்த டெம்ப்ளேட்டை நீக்க விரும்புகிறீர்களா?",
    "varName": "{name} - வாடிக்கையாளரின் பெயர்",
    "varCompany": "{company} - நிறுவனம்",
    "varCity": "{city} - நகரம்",
    "varValue": "{value} - ஒப்பந்த மதிப்பு",
    "varBusiness": "{business} - உங்கள் வணிகப் பெயர்",
    "varDate": "{date} - இன்றைய தேதி",
    "composerTitle": "வாட்ஸ்அப் செய்தி",
    "pickTemplate": "உங்கள் டெம்ப்ளேட்கள்",
    "aiGenerate": "ஏஐ மூலம் எழுதவும்",
    "sentActivity": "டெம்ப்ளேட் மூலம் வாட்ஸ்அப் அனுப்பப்பட்டது",
    "sampleName": "மாதிரி வாடிக்கையாளர்",
}

T["te"] = {
    "title": "సందేశ టెంప్లేట్లు",
    "desc": "మీ సొంత వాట్సాప్ సందేశాలు సేవ్ చేయండి. ఏ లీడ్ తెరవండి, టెంప్లేట్ నొక్కండి - సందేశం వెంటనే పంపడానికి సిద్ధమవుతుంది.",
    "add": "టెంప్లేట్ జోడించండి",
    "edit": "టెంప్లేట్ సవరించండి",
    "name": "టెంప్లేట్ పేరు",
    "namePh": "ఉదా: మొదటి సంప్రదింపు",
    "content": "సందేశం",
    "contentPh": "మీ సందేశం ఇక్కడ రాయండి...",
    "insertVar": "జోడించడానికి నొక్కండి",
    "makeDefault": "డిఫాల్ట్ చేయండి",
    "defaultDesc": "లీడ్ తెరిచేసరికి ఈ సందేశం దానంతట అదే తెరుచుకుంటుంది",
    "defaultBadge": "డిఫాల్ట్",
    "noTemplates": "ఇంకా టెంప్లేట్లు లేవు",
    "noTemplatesDesc": "మొదటి సందేశ టెంప్లేట్ సేవ్ చేసి, వాట్సాప్ ఫాలో-అప్ ఒకే నొక్కడంతో పంపండి",
    "preview": "ప్రివ్యూ",
    "useHint": "ఏ లీడ్ తెరవండి, టెంప్లేట్ నొక్కండి - సందేశం వాట్సాప్‌లో పంపడానికి సిద్ధంగా తెరుచుకుంటుంది",
    "emptyName": "టెంప్లేట్ పేరు రాయండి",
    "emptyContent": "సందేశం రాయండి",
    "confirmDelete": "ఈ టెంప్లేట్ తొలగించాలా?",
    "varName": "{name} - కస్టమర్ పేరు",
    "varCompany": "{company} - కంపెనీ",
    "varCity": "{city} - నగరం",
    "varValue": "{value} - డీల్ విలువ",
    "varBusiness": "{business} - మీ వ్యాపారం పేరు",
    "varDate": "{date} - ఈరోజు తేదీ",
    "composerTitle": "వాట్సాప్ సందేశం",
    "pickTemplate": "మీ టెంప్లేట్లు",
    "aiGenerate": "ఏఐతో రాయించండి",
    "sentActivity": "టెంప్లేట్‌తో వాట్సాప్ పంపారు",
    "sampleName": "నమూనా కస్టమర్",
}

T["kn"] = {
    "title": "ಸಂದೇಶ ಟೆಂಪ್ಲೇಟ್‌ಗಳು",
    "desc": "ನಿಮ್ಮ ಸ್ವಂತ ವಾಟ್ಸಾಪ್ ಸಂದೇಶಗಳನ್ನು ಉಳಿಸಿ. ಯಾವುದೇ ಲೀಡ್ ತೆರೆಯಿರಿ, ಟೆಂಪ್ಲೇಟ್ ಒತ್ತಿ, ಸಂದೇಶ ತಕ್ಷಣ ಕಳುಹಿಸಲು ಸಿದ್ಧವಾಗುತ್ತದೆ.",
    "add": "ಟೆಂಪ್ಲೇಟ್ ಸೇರಿಸಿ",
    "edit": "ಟೆಂಪ್ಲೇಟ್ ಸಂಪಾದಿಸಿ",
    "name": "ಟೆಂಪ್ಲೇಟ್‌ನ ಹೆಸರು",
    "namePh": "ಉದಾ: ಮೊದಲ ಸಂಪರ್ಕ",
    "content": "ಸಂದೇಶ",
    "contentPh": "ನಿಮ್ಮ ಸಂದೇಶವನ್ನು ಇಲ್ಲಿ ಬರೆಯಿರಿ...",
    "insertVar": "ಸೇರಿಸಲು ಒತ್ತಿ",
    "makeDefault": "ಡೀಫಾಲ್ಟ್ ಮಾಡಿ",
    "defaultDesc": "ಲೀಡ್ ತೆರೆದ ತಕ್ಷಣ ಈ ಸಂದೇಶ ತಾನಾಗಿಯೇ ತೆರೆಯುತ್ತದೆ",
    "defaultBadge": "ಡೀಫಾಲ್ಟ್",
    "noTemplates": "ಇನ್ನೂ ಟೆಂಪ್ಲೇಟ್‌ಗಳಿಲ್ಲ",
    "noTemplatesDesc": "ಮೊದಲ ಸಂದೇಶ ಟೆಂಪ್ಲೇಟ್ ಉಳಿಸಿ, ವಾಟ್ಸಾಪ್ ಫಾಲೋ-ಅಪ್ ಒಂದೇ ಒತ್ತುವಿಕೆಯಲ್ಲಿ ಕಳುಹಿಸಿ",
    "preview": "ಪ್ರಿವ್ಯೂ",
    "useHint": "ಯಾವುದೇ ಲೀಡ್ ತೆರೆಯಿರಿ, ಟೆಂಪ್ಲೇಟ್ ಒತ್ತಿ - ಸಂದೇಶ ವಾಟ್ಸಾಪ್‌ನಲ್ಲಿ ಕಳುಹಿಸಲು ಸಿದ್ಧವಾಗಿ ತೆರೆಯುತ್ತದೆ",
    "emptyName": "ಟೆಂಪ್ಲೇಟ್‌ನ ಹೆಸರು ಬರೆಯಿರಿ",
    "emptyContent": "ಸಂದೇಶ ಬರೆಯಿರಿ",
    "confirmDelete": "ಈ ಟೆಂಪ್ಲೇಟ್ ಅಳಿಸಲು ಬಯಸುವಿರಾ?",
    "varName": "{name} - ಗ್ರಾಹಕರ ಹೆಸರು",
    "varCompany": "{company} - ಕಂಪನಿ",
    "varCity": "{city} - ನಗರ",
    "varValue": "{value} - ವ್ಯವಹಾರದ ಮೌಲ್ಯ",
    "varBusiness": "{business} - ನಿಮ್ಮ ವ್ಯಾಪಾರದ ಹೆಸರು",
    "varDate": "{date} - ಇಂದಿನ ದಿನಾಂಕ",
    "composerTitle": "ವಾಟ್ಸಾಪ್ ಸಂದೇಶ",
    "pickTemplate": "ನಿಮ್ಮ ಟೆಂಪ್ಲೇಟ್‌ಗಳು",
    "aiGenerate": "ಎಐ ಬರೆಯಿಸಿ",
    "sentActivity": "ಟೆಂಪ್ಲೇಟ್ ಬಳಸಿ ವಾಟ್ಸಾಪ್ ಕಳುಹಿಸಲಾಗಿದೆ",
    "sampleName": "ಮಾದರಿ ಗ್ರಾಹಕ",
}


def build_block(d):
    lines = ['  "templates": {']
    items = list(d.items())
    for i, (k, v) in enumerate(items):
        comma = "," if i < len(items) - 1 else ""
        lines.append('    "{}": {}{}'.format(k, json.dumps(v, ensure_ascii=False), comma))
    lines.append("  },")
    return "\n".join(lines)


def main():
    ok = True
    for lang, d in T.items():
        path = os.path.join(ROOT, f"{lang}.json")
        with open(path, "r", encoding="utf-8") as f:
            text = f.read()
        if '"templates"' in text:
            print(f"{lang}: templates section already present - SKIP")
            continue
        assert text.count(ANCHOR) == 1, f"{lang}: anchor line not unique ({text.count(ANCHOR)})"
        # sanity: the line right before the anchor must close the alarm section
        lines = text.split("\n")
        idx = lines.index(ANCHOR)
        assert lines[idx - 1].strip() in ("},", "}"), f"{lang}: unexpected line before anchor: {lines[idx-1]!r}"
        block = build_block(d)
        expected = text.replace(ANCHOR, block + "\n" + ANCHOR)
        new_text = text.replace(ANCHOR, block + "\n" + ANCHOR)
        assert new_text == expected  # deterministic single replacement
        assert new_text.count('"templates": {') == 1
        json.loads(new_text)  # must parse
        with open(path, "w", encoding="utf-8") as f:
            f.write(new_text)
        print(f"{lang}: inserted templates section ({len(d)} keys) before languageNames")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
