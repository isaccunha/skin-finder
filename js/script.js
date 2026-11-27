const skinImg = document.querySelector('.skin_img');
const form = document.querySelector('.form');
const input = document.querySelector('.input_search');
const downloadLink = document.querySelector('.download');

const DEFAULT_UUID = 'ec561538f3fd461daff5086b22154bce';
const DEFAULT_NAME = 'Alex';

let currentSkinUrl = `https://mc-heads.net/skin/${DEFAULT_UUID}`;
let currentPlayerName = DEFAULT_NAME;

const normalizeUuid = (uuid) => uuid.replace(/-/g, '');

const fetchPlayer = async (name) => {
    const encodedName = encodeURIComponent(name.trim());
    if (!encodedName) return null;

    try {
        const response = await fetch(`https://playerdb.co/api/player/minecraft/${encodedName}`);
        if (response.ok) {
            const data = await response.json();
            if (data?.success && data?.data?.player?.id) {
                return {
                    uuid: normalizeUuid(data.data.player.id),
                    username: data.data.player.username || name.trim(),
                };
            }
        }
    } catch (error) {
        console.warn('PlayerDB lookup failed, trying fallback API:', error);
    }

    try {
        const fallbackResponse = await fetch(`https://mc-api.io/uuid/${encodedName}/JAVA`);
        if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            if (fallbackData?.uuid) {
                return {
                    uuid: normalizeUuid(fallbackData.uuid),
                    username: name.trim(),
                };
            }
        }
    } catch (error) {
        console.warn('Fallback UUID lookup failed:', error);
    }

    return null;
};

const renderSkin = (uuid, username) => {
    const cleanUuid = normalizeUuid(uuid);
    const bodyUrl = `https://mc-heads.net/body/${cleanUuid}`;
    const skinUrl = `https://mc-heads.net/skin/${cleanUuid}`;

    currentSkinUrl = skinUrl;
    currentPlayerName = username;

    skinImg.style.display = 'block';
    skinImg.alt = `${username} Skin`;
    skinImg.onerror = () => {
        skinImg.onerror = null;
        skinImg.src = `https://crafatar.com/renders/body/${cleanUuid}?overlay`;
    };
    skinImg.src = bodyUrl;

    downloadLink.href = skinUrl;
    downloadLink.download = `${username}-skin.png`;
};

const fetchSkin = async (name) => {
    const player = await fetchPlayer(name);
    if (player) {
        renderSkin(player.uuid, player.username);
    } else {
        renderSkin(DEFAULT_UUID, DEFAULT_NAME);
    }
    input.value = '';
};

form.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = input.value.trim();
    if (query) {
        fetchSkin(query);
    }
});

downloadLink.addEventListener('click', async (event) => {
    event.preventDefault();
    try {
        const response = await fetch(currentSkinUrl);
        if (!response.ok) throw new Error('Failed to fetch skin image');
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const tempLink = document.createElement('a');
        tempLink.href = blobUrl;
        tempLink.download = `${currentPlayerName}-skin.png`;
        document.body.appendChild(tempLink);
        tempLink.click();
        tempLink.remove();
        URL.revokeObjectURL(blobUrl);
    } catch {
        window.open(currentSkinUrl, '_blank', 'noopener,noreferrer');
    }
});

fetchSkin(DEFAULT_NAME);