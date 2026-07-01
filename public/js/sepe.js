async function findSepe() {
    try {
        const response = await fetch(
            "http://localhost:44642/tv3/sensory-effect-renderers"
        );

        console.log("Response:", response);

        if (!response.ok) {
            console.log(response)
            return null;
        }

        const data = await response.json();
        if (!data || !data.renderers || data.renderers.length === 0) {
            return null;
        }

        sepe = data.renderers[0];
        return data.renderers[0];
    } catch (error) {
        console.error("Error fetching SEPE:", error);
        return null;
    }
}

async function playLightEffect(sepe, action, color, location) {
    const properties = [{ name: "color", value: color }];
    if (location) {
        properties.push({ name: "location", value: location });
    }
    const body = {
        effectType: "LightType",
        action: action,
        properties: properties,
    };

    const response = await fetch(
        "http://localhost:44642/tv3/sensory-effect-renderers/" + sepe.id,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        }
    );

    if(!response.ok) {
        console.warn(response)
    }
}

async function playScentEffect(sepe, action, intensity, location) {
    const properties = [{ name: "intensity", value: intensity }];
    if (location) {
        properties.push({ name: "location", value: location });
    }
    const body = {
        effectType: "ScentType",
        action: action,
        properties: properties,
    };

    const response = await fetch(
        "http://localhost:44642/tv3/sensory-effect-renderers/" + sepe.id,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        }
    );

    if(!response.ok) {
        console.warn(response)
    }
}

async function turnOffEffects() {
    const sepe = findSepe();
    if(sepe){
        playLightEffect(sepe, "stop", [0,0,0]);
        playScentEffect(sepe, "stop", 0)
    }
}