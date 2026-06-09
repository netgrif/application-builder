# Handoff: BPMN editor + AI asistent integrácia

## Cieľ (user flow)
Užívateľ nahrá vlastné **.bpmn** → vidí ho ako **BPMN aj Petriflow** → cez AI asistenta
v prirodzenom jazyku dorobí **formy, akcie, roly, dáta** → stále to vidí ako **BPMN aj Petriflow**.

## Repo / branch
- Projekt: Angular app builder (`@netgrif/petriflow`, `bpmn-js`).
- Pracovná branch: **`BPMN-prototype`** (merge `NAB-396` doň už spravený).
- Spustenie: `npm install --legacy-peer-deps` → `npm start` (dev server `localhost:4200`).
  Build: `npm run build` (prejde, EXIT=0).
- Pozn.: `src/app/modeler/services/ai-assistant/generated-petriflow-prompts.ts` sa **regeneruje**
  prebuild skriptom z `src/petriflow-context/*.md` — necommitovať jeho LF/CRLF zmeny.
- Preview/screenshot MCP pri tejto appke (21 MB dev bundle) **timeoutuje** — vizuál overovať ručne
  v prehliadači.

## Kľúčová architektúra (toto treba pochopiť)
- **BPMN diagram = zdroj pravdy pre ŠTRUKTÚRU workflow.** `bpmn2pn` servis mapuje element `X` →
  transition `X_t`.
- **`EnrichmentService` = zdroj pravdy pre ENRICHMENT** (per-task formy/roly/akcie/triggery +
  globálne roly/dáta), kľúčované cez BPMN element id (`transitionIdToActivityKey` strihá `_t`).
- Finálny model = `bpmn2pn(bpmnXml)` + `EnrichmentService.materializeInto(net)`. Model v
  `ModelService` je **throwaway**, prerátaný pri každom converte.
- **Label = názov BPMN elementu** → `materializeInto` ho zámerne NEoverlayuje (BPMN vyhráva);
  label zmeny sa musia zapisovať späť do diagramu.
- One-way lock: štrukturálna úprava v Petriflow edit-mode flipne `modelOrigin` bpmn→petriflow
  a vymaže BPMN stav. `importFromXml` **nemení** `modelOrigin` (overené).

## Čo je hotové (commity na `BPMN-prototype`)
1. `4ed4f31` — **Merge** NAB-396 (AI asistent) do BPMN-prototype. Konflikty boli len additívne
   (app.module, control-panel.service, tutorial-service, package.json, angular.json).
2. `7aa7713` — **Enrichment-aware apply**: `AiAssistantService.applyXmlString` po `importFromXml`
   v BPMN projekte volá `enrichment.harvestAll(model)` → AI formy/roly/akcie prežijú re-konverziu.
   Vracia `structuralChange`. + BPMN guard v `sendUserMessage` (meniť len enrichment, zachovať id)
   + návrat na `/modeler/bpmn` po Apply.
3. `c047bd3` — **Layout fix**: `ai-mode.component.scss` `:host` dostal `height:100%`.
4. `4e79c67` — **Label propagácia**: `BpmnStateService.pendingLabelOverrides` (elementId→label)
   sa naplní pri Apply; `BpmnModeComponent._applyPendingLabels` ich po načítaní diagramu zapíše
   cez `modeling.updateLabel`.
5. `f2d7b7e` — **XML code blok** (prose vs XML split: `proseOf`/`xmlOf`, monospace, collapsible)
   + **kontextový welcome** (`bpmnEnrichExamples` keď `isBpmnProject`).
6. `529cb94` — **Auto-scroll fix**: scroll len pri novej bubline (`_lastMsgCount`), nie pri každom
   tokene.
7. `a66469e` — **Patch/ops mód**: AI pri malej zmene vráti `{"ops":[...]}`
   (setLabel/addRole/assignRole/addField/addAction); `applyPatchString` aplikuje priamo na model
   cez petriflow primitíva + history + (BPMN) harvest/labels. Karta „Targeted changes" v chate.

## Kľúčové súbory
- `src/app/modeler/bpmn-mode/` — `bpmn-mode.component.ts` (canvas, ctx menu, `_applyPendingLabels`,
  debounced convert), `enrichment.service.ts` (`harvestAll`/`materializeInto`/`gc`),
  `bpmn-state.service.ts` (`xml`, `isBpmnProject`, `pendingLabelOverrides`),
  `bpmn-conversion.util.ts` (`transitionIdToActivityKey`, `assignSystemPerformer`).
- `src/app/modeler/services/ai-assistant/ai-assistant.service.ts` — chat/stream, `applyXmlString`,
  `applyPatchString` + op aplikátory, `PATCH_PROTOCOL`, BPMN guard.
- `src/app/modeler/components/ai-chat-component/` — chat UI (welcome, XML blok, patch karta, scroll).
- `src/app/modeler/control-panel/modes/import-tool.ts` — `.bpmn` import (bpmn2pn + seed enrichment
  + `isBpmnProject`).
- `src/app/modeler/model-import-service.ts` — `importFromXml` (nahradí model, naviguje `/modeler`).

## Ako otestovať (manuálne, e2e)
1. Import `.bpmn` (ikona upload). Over: BPMN mód = diagram; data/role/form mód = skonvertovaný
   Petriflow; `modelOrigin==='bpmn'`.
2. AI mód → nastaviť providera + API kľúč (ozubené koliesko) pre reálne odpovede; FREE MOCKUP chipy
   fungujú offline.
3. Enrichment: *„Add an approval form with fields Reason and Date to the Manager Review task; add
   role Approver"* → Apply → návrat do BPMN, diagram nezmenený, enrichment v Petriflow móde, prežije
   re-convert aj reload.
4. Patch: *„rename the tasks to clearer labels"* → mala by prísť karta **Targeted changes** (nie celé
   XML) → Apply → nové názvy na taskoch.

## Známe limity / ďalšie kroky
- **bpmn2pn** servis musí byť dostupný (URL z app configu) — bez neho sa `.bpmn` nenakonvertuje.
- Štrukturálne AI zmeny (nový task/gateway) sa do BPMN diagramu **neaplikujú** — len varovanie
  (MVP rozhodnutie).
- Model sa **sám rozhoduje** patch vs. plné XML — ak by vracal plné XML aj pri malej zmene,
  pritvrdiť `PATCH_PROTOCOL`.
- `nab:enrichmentKey` moddle atribút (stabilita id pri copy/paste) je DEFERRED.
- Nedokončený plný runtime e2e (potrebuje bpmn2pn + AI kľúč + prehliadač).
- Voliteľné B4: položka „Ask AI" priamo v BPMN context menu (zatiaľ mimo MVP).
- API kľúče sú v browser localStorage (žiadny server-side proxy); AI texty hard-coded EN (bez i18n).
