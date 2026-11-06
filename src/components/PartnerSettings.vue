<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useShareStore } from '@/stores/share'

// Pairing with a partner: start (invite code) or join with a code; what to share; end.
const share = useShareStore()
const name = ref(share.settings.me)
const code = ref('')
const joined = ref('')
// Opening the section shows whether the partner has joined meanwhile.
onMounted(() => void share.refresh())

async function join() {
  const p = await share.join(code.value, name.value)
  if (p) joined.value = `${p} ile eşleştiniz ✓`
}
async function leave() {
  if (confirm('Eşleşme bitirilsin mi? Paylaştığın günler sunucudan silinir; partnerin artık seni göremez.')) await share.leave()
}
const until = (iso: string) => new Date(iso).toLocaleString('tr-TR', { weekday: 'long', hour: '2-digit', minute: '2-digit' })
</script>

<template>
  <div class="partner">
    <template v-if="!share.paired">
      <p class="small muted">
        Erkek arkadaşın, eşin ya da bir arkadaşınla birbirinizin gününü (yedikleri, sporu, adımları, kilo gidişatı) görün, birbirinize 👏 💪 gönderin.
        İkinizin de telefonunda Diyetbot olmalı.
      </p>
      <label class="field"><span class="label">Adın (partnerin böyle görür)</span><input v-model="name" type="text" maxlength="40" placeholder="Ör. Sezer" /></label>

      <div class="box">
        <div class="label">Davet et</div>
        <p class="small muted">Bir kod oluştur, partnerine gönder.</p>
        <button type="button" class="btn" :disabled="share.busy || !name.trim()" @click="share.start(name)">Davet kodu oluştur</button>
      </div>
      <div class="box">
        <div class="label">Kodum var</div>
        <div class="row">
          <input v-model="code" type="text" placeholder="ABCD-1234" autocapitalize="characters" maxlength="12" />
          <button type="button" class="btn" :disabled="share.busy || !name.trim() || code.trim().length < 8" @click="join">Katıl</button>
        </div>
      </div>
    </template>

    <template v-else>
      <p v-if="joined" class="small ok" role="status">{{ joined }}</p>
      <p v-if="share.view?.partner" class="small">
        <strong>{{ share.view.partner.name }}</strong> ile eşleştiniz. Gününü Bugün ekranındaki kartta görürsün.
      </p>
      <template v-else>
        <p class="small">Partnerinin katılmasını bekliyorsun.</p>
        <div v-if="share.invite" class="code">
          <div class="label">Davet kodu</div>
          <div class="num big">{{ share.invite.code }}</div>
          <p class="small muted">Bu kodu partnerine gönder; Diyetbot'ta Ben → Profil → 👫 Partnerim → "Kodum var" bölümüne yazsın. {{ until(share.invite.expires_at) }}'e kadar geçerli, tek kullanımlık.</p>
        </div>
        <button type="button" class="btn ghost small" :disabled="share.busy" @click="share.newCode()">{{ share.invite ? 'Yeni kod' : 'Davet kodunu göster' }}</button>
      </template>

      <div class="box">
        <div class="label">Neyi paylaşıyorsun</div>
        <p class="small muted">Kalori, protein, su, spor ve adım her zaman paylaşılır.</p>
        <label class="check"><input type="checkbox" :checked="share.settings.prefs.foods" @change="share.setPrefs({ foods: ($event.target as HTMLInputElement).checked })" /><span>Ne yediğim (öğün öğün)</span></label>
        <label class="check"><input type="checkbox" :checked="share.settings.prefs.weightChange" @change="share.setPrefs({ weightChange: ($event.target as HTMLInputElement).checked })" /><span>Kilo değişimi (haftalık ortalama, ör. −0,4 kg)</span></label>
        <label class="check"><input type="checkbox" :checked="share.settings.prefs.weightExact" @change="share.setPrefs({ weightExact: ($event.target as HTMLInputElement).checked })" /><span>Kilom (kg)</span></label>
      </div>
      <button type="button" class="btn danger small" :disabled="share.busy" @click="leave">Eşleşmeyi bitir</button>
    </template>
    <p v-if="share.error" class="small warn" role="alert">{{ share.error }}</p>
  </div>
</template>

<style scoped>
.partner { display: grid; gap: 10px; }
.box { background: var(--surface-2); border-radius: 14px; padding: 10px 12px; display: grid; gap: 6px; }
.row { display: flex; gap: 8px; }
.row input { flex: 1; min-width: 0; text-transform: uppercase; }
.code { background: var(--accent-soft); border-radius: 14px; padding: 12px; text-align: center; }
.big { font-size: 1.8rem; font-weight: 800; letter-spacing: 0.08em; color: var(--accent); }
.check { display: flex; gap: 8px; align-items: center; }
.ok { color: var(--accent); }
.warn { color: var(--warn-ink); background: var(--warn-bg); border-radius: 10px; padding: 8px 10px; }
</style>
