<script setup lang="ts">
import { ref } from 'vue'
import { CheckCircle, XCircle, RotateCcw } from 'lucide-vue-next'
import CaButton from '~/components/atoms/CaButton.vue'
import ConfirmDialog from '~/components/molecules/ConfirmDialog.vue'
import type { VerificationActionPayload, VerificationStatus } from '~/types/verification'

const props = defineProps<{
    status: VerificationStatus
    saving?: boolean
}>()

const emit = defineEmits<{
    (e: 'action', payload: VerificationActionPayload): void
}>()

const notes = ref('')
const confirmAction = ref<'approve' | 'reject' | 'request_revision' | null>(null)

const canReview = computed(() =>
    props.status === 'SUBMITTED' || props.status === 'UNDER_REVIEW'
)

const confirmTitle: Record<string, string> = {
    approve: 'Setujui Verifikasi',
    reject: 'Tolak Verifikasi',
    request_revision: 'Minta Revisi',
}

const confirmMessage: Record<string, string> = {
    approve: 'Anda yakin menyetujui verifikasi berkas ini? Asesi akan maju ke tahap penjadwalan ujian.',
    reject: 'Anda yakin menolak verifikasi ini? Asesi tidak akan dapat melanjutkan proses.',
    request_revision: 'Asesi akan diminta melengkapi/memperbaiki berkas yang kurang.',
}

const confirmVariant: Record<string, 'default' | 'danger' | 'warning'> = {
    approve: 'default',
    reject: 'danger',
    request_revision: 'warning',
}

const handleAction = (action: 'approve' | 'reject' | 'request_revision') => {
    confirmAction.value = action
}

const handleConfirm = () => {
    if (!confirmAction.value) return
    emit('action', {
        action: confirmAction.value,
        notes: notes.value,
    })
    confirmAction.value = null
    notes.value = ''
}
</script>

<template>
    <div v-if="canReview" class="ca-card p-6 space-y-4">
        <h3 class="text-xs font-black uppercase tracking-widest text-content-subtle">Catatan Review</h3>
        <BaseTextarea
            id="review-notes"
            v-model="notes"
            placeholder="Tulis catatan review di sini (opsional untuk approve, wajib untuk revisi/tolak)..."
        />

        <div class="flex flex-col sm:flex-row items-center gap-3">
            <CaButton
                variant="outline"
                class="flex-1 justify-center gap-2"
                :disabled="saving"
                @click="handleAction('request_revision')"
            >
                <RotateCcw class="w-4 h-4 text-orange-400" />
                Minta Revisi
            </CaButton>
            <CaButton
                variant="outline"
                class="flex-1 justify-center gap-2 !text-red-400 hover:!bg-red-500/10"
                :disabled="saving"
                @click="handleAction('reject')"
            >
                <XCircle class="w-4 h-4" />
                Tolak
            </CaButton>
            <CaButton
                variant="primary"
                class="flex-1 justify-center gap-2"
                :loading="saving"
                @click="handleAction('approve')"
            >
                <CheckCircle class="w-4 h-4" />
                Setujui
            </CaButton>
        </div>
    </div>

    <!-- Already processed info -->
    <div v-else-if="status === 'VERIFIED'" class="ca-card p-6 flex items-center gap-3 border-emerald-500/20">
        <CheckCircle class="w-5 h-5 text-emerald-500 shrink-0" />
        <p class="text-sm text-emerald-400 font-bold">Berkas telah diverifikasi dan disetujui.</p>
    </div>
    <div v-else-if="status === 'REJECTED'" class="ca-card p-6 flex items-center gap-3 border-red-500/20">
        <XCircle class="w-5 h-5 text-red-400 shrink-0" />
        <p class="text-sm text-red-400 font-bold">Berkas telah ditolak.</p>
    </div>
    <div v-else-if="status === 'REVISION_NEEDED'" class="ca-card p-6 flex items-center gap-3 border-orange-500/20">
        <RotateCcw class="w-5 h-5 text-orange-400 shrink-0" />
        <p class="text-sm text-orange-400 font-bold">Menunggu revisi dari asesi.</p>
    </div>

    <!-- Confirm Dialog -->
    <ConfirmDialog
        :open="!!confirmAction"
        :variant="confirmAction ? confirmVariant[confirmAction] : 'default'"
        :title="confirmAction ? confirmTitle[confirmAction] : ''"
        :message="confirmAction ? confirmMessage[confirmAction] : ''"
        :loading="saving"
        @confirm="handleConfirm"
        @cancel="confirmAction = null"
    />
</template>
