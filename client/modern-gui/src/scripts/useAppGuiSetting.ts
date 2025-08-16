import { useEffect, useState } from "react"

export type AppGuiSetting = {
    version: string,
    edition: string,
}

export type ServerInfo = {
    version: string,
    edition: string,
}

export type AppGuiSettingState = {
    appGuiSetting: AppGuiSetting
    serverInfo: ServerInfo
}

// Custom hook to fetch app GUI settings and server info
export const useAppGuiSetting = (): AppGuiSettingState => {
    // ---------------- State ----------------
    const [appGuiSetting, setAppGuiSetting] = useState<AppGuiSetting>({ version: "", edition: "" })
    const [serverInfo, setServerInfo] = useState<ServerInfo>({ version: "", edition: "" })

    // ---------------- Hooks ----------------

    // Initial loading of app GUI settings
    useEffect(() => {
        getAppGuiSetting("assets/gui_settings/GUI.json");
    }, [])

    // Initial loading of server version
    useEffect(() => {
        const getVersionInfo = async () => {
            const res = await fetch('/version');
            const version = await res.text();
            setServerInfo({ ...serverInfo, version: version });
        }
        getVersionInfo()
    }, [])

    // Initial loading of server edition
    useEffect(() => {
        const getVersionInfo = async () => {
            const res = await fetch('/edition');
            const edition = await res.text();
            setServerInfo({ ...serverInfo, edition: edition });
        }
        getVersionInfo()
    }, [])

    // ---------------- Functions ----------------

    // Fetch app GUI settings from server
    const getAppGuiSetting = async (url: string) => {
        const res = await fetch(`${url}`, {
            method: "GET",
        });
        const appSetting = await res.json() as AppGuiSetting;

        setAppGuiSetting(appSetting);
    }

    return {
        appGuiSetting,
        serverInfo,
    }
}
