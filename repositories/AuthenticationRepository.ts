import {requestUrl} from "obsidian";
import {generateQueryString, PluginSettings} from "../main";
import {CLIENT_ID, REDIRECT_URI} from "../AuthenticationConsts";

export class AuthenticationRepository {
	settings: PluginSettings


	constructor(settings: PluginSettings) {
		this.settings = settings;
	}

	requestAuthTokenUpdate(serverCode: string): Promise<string> {
		return requestUrl({
			url: "https://public-api.wordpress.com/oauth2/token",
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'User-Agent': 'obsidian.md'
			},
			body: generateQueryString({
				grant_type: 'authorization_code',
				client_id: CLIENT_ID,
				code: serverCode,
				redirect_uri: REDIRECT_URI,
			})
		}).then(response => {
			console.log('getToken response', response);
			return response.json.access_token
		}).catch(function (error) {
			console.log(error.message);
		});
	}

	static getAuthorizeServerUrlParams(): string  {
		const authUrl = new URL("https://public-api.wordpress.com/oauth2/authorize")
		authUrl.searchParams.append("client_id", CLIENT_ID)
		authUrl.searchParams.append("redirect_uri", REDIRECT_URI)
		authUrl.searchParams.append("response_type", "code")
		authUrl.searchParams.append("scope", "global")
		return authUrl.href
	}
}
