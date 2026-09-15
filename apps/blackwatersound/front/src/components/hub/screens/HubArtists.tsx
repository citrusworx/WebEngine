import { HubBtn } from "../HubBtn";
import { HubMiniBar } from "../HubMiniBar";
import { AUDIENCE_INSIGHTS, HUB_COLORS, SIMILAR_ARTISTS } from "../../../data/hub";

const TABLE_HEADERS = ["Artist", "Genre", "Age Range", "Top Regions", "Spotify", "YouTube", "Merch", "Live"] as const;

export function HubArtists() {
  return (
    <div hub-content>
      <div row gap="0.75rem" style={{ marginBottom: "24px" }}>
        <input hub-input type="text" placeholder="Add a similar artist..." style={{ flex: 1 }} />
        <HubBtn label="Add Artist" variant="primary" />
      </div>

      <article hub-panel hub-table-panel>
        <header hub-table-head>
          <p hub-panel-title>Similar Artist Comparison</p>
          <p hub-panel-sub style={{ marginBottom: 0 }}>Fan overlap and audience signals</p>
        </header>
        <div hub-table-wrap>
          <table hub-table>
            <thead>
              <tr>
                {TABLE_HEADERS.map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SIMILAR_ARTISTS.map((artist, index) => (
                <tr key={artist.name} data-stripe={index % 2 === 0 ? "even" : "odd"}>
                  <td data-strong>{artist.name}</td>
                  <td>{artist.genre}</td>
                  <td data-mono>{artist.age}</td>
                  <td>{artist.region}</td>
                  <td><HubMiniBar value={artist.spotify} /></td>
                  <td><HubMiniBar value={artist.youtube} /></td>
                  <td><HubMiniBar value={artist.merch} /></td>
                  <td><HubMiniBar value={artist.shows} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article hub-panel>
        <p hub-panel-title>Audience Overlap Insights</p>
        <div hub-insight-grid>
          {AUDIENCE_INSIGHTS.map((item) => (
            <div key={item.insight} hub-insight-card>
              <p hub-panel-title style={{ fontSize: "13px", marginBottom: "4px" }}>{item.insight}</p>
              <p hub-brand-sub style={{ color: HUB_COLORS.violet, textTransform: "none", letterSpacing: "normal", fontSize: "10px", marginBottom: "8px" }}>
                {item.artists}
              </p>
              <p hub-panel-sub style={{ margin: 0, lineHeight: 1.6 }}>{item.action}</p>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}
