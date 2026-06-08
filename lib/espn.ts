// ESPN API — Copa do Mundo 2026
// Não requer chave de API

const BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world";

export type JogoESPN = {
  espn_id:    string;
  time1:      string;   // home
  time2:      string;   // away
  bandeira1:  string | null;
  bandeira2:  string | null;
  data_jogo:  string;   // ISO string
  status:     "scheduled" | "in_progress" | "final";
  gols1:      number | null;
  gols2:      number | null;
  fase:       string;
  grupo:      string | null;
  venue:      string | null;
};

type ESPNEvent = {
  id: string;
  date: string;
  season?: { slug?: string };
  competitions: Array<{
    status: { type: { name: string; completed: boolean } };
    competitors: Array<{
      homeAway: string;
      team: { displayName: string; flag?: { href?: string } };
      score?: string;
    }>;
    groups?: { name?: string; shortName?: string };
    venue?: { fullName?: string };
    notes?: Array<{ type?: string; headline?: string }>;
  }>;
};

/**
 * Busca jogos de uma data específica (formato: YYYYMMDD)
 */
export async function buscarJogosDoDia(dataYYYYMMDD: string): Promise<JogoESPN[]> {
  const url = `${BASE}/scoreboard?dates=${dataYYYYMMDD}&limit=50`;
  const res  = await fetch(url, { next: { revalidate: 0 } });

  if (!res.ok) throw new Error(`ESPN retornou ${res.status} para ${url}`);

  const json = await res.json();
  const events: ESPNEvent[] = json.events ?? [];

  return events.map(parseEvento);
}

/**
 * Busca jogos de um intervalo de datas (útil para seed inicial)
 */
export async function buscarJogosIntervalo(inicio: string, fim: string): Promise<JogoESPN[]> {
  const url = `${BASE}/scoreboard?dates=${inicio}-${fim}&limit=200`;
  const res  = await fetch(url, { next: { revalidate: 0 } });

  if (!res.ok) throw new Error(`ESPN retornou ${res.status}`);

  const json   = await res.json();
  const events: ESPNEvent[] = json.events ?? [];

  return events.map(parseEvento);
}

function parseEvento(event: ESPNEvent): JogoESPN {
  const comp       = event.competitions[0];
  const statusName = comp.status.type.name.toLowerCase();     // "STATUS_SCHEDULED" etc.
  const finalizado = comp.status.type.completed;

  const home = comp.competitors.find((c) => c.homeAway === "home")!;
  const away = comp.competitors.find((c) => c.homeAway === "away")!;

  const gols1 = finalizado && home.score !== undefined ? parseInt(home.score, 10) : null;
  const gols2 = finalizado && away.score !== undefined ? parseInt(away.score, 10) : null;

  // Fase e grupo
  const note  = comp.notes?.find((n) => n.type === "event")?.headline ?? "";
  const grupo = comp.groups?.shortName ?? extrairGrupo(note);
  const fase  = inferirFase(note, grupo);

  return {
    espn_id:   event.id,
    time1:     home.team.displayName,
    time2:     away.team.displayName,
    bandeira1: null,
    bandeira2: null,
    data_jogo: event.date,
    status:    finalizado ? "final" : statusName.includes("progress") ? "in_progress" : "scheduled",
    gols1,
    gols2,
    fase,
    grupo,
    venue: comp.venue?.fullName ?? null,
  };
}

function extrairGrupo(note: string): string | null {
  const m = note.match(/grupo\s+([A-L])/i) ?? note.match(/group\s+([A-L])/i);
  return m ? m[1].toUpperCase() : null;
}

function inferirFase(note: string, grupo: string | null): string {
  const n = note.toLowerCase();
  if (grupo)                         return "grupos";
  if (n.includes("round of 32"))     return "oitavas";
  if (n.includes("round of 16"))     return "quartas";  // Copa 2026 nomenclatura diferente
  if (n.includes("quarterfinal"))    return "quartas";
  if (n.includes("semifinal"))       return "semi";
  if (n.includes("third"))           return "terceiro";
  if (n.includes("final"))           return "final";
  return "grupos";
}
