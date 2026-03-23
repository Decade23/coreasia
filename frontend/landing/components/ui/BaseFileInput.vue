<template>
  <div class="w-full">
    <label v-if="label" :for="id" class="ca-field-label">
      {{ label }}
      <span v-if="required" class="ca-required">*</span>
    </label>

    <input
      :id="id"
      ref="fileInput"
      class="sr-only"
      type="file"
      :accept="accept"
      :required="required"
      :disabled="disabled || loading"
      @change="handleChange"
    />

    <button
      type="button"
      class="ca-card-soft flex w-full items-center justify-between gap-4 rounded-2xl border border-dashed p-4 text-left transition duration-200"
      :class="[
        disabled || loading ? 'cursor-not-allowed opacity-60' : 'hover:-translate-y-0.5 hover:border-amber-300/30 hover:bg-[var(--ca-panel-bg-strong)]',
        error ? '!border-[color:var(--ca-danger-border)]' : '',
      ]"
      :disabled="disabled || loading"
      @click="openPicker"
    >
      <div class="flex min-w-0 items-center gap-3">
        <div class="ca-icon-gold h-11 w-11 rounded-2xl">
          <Icon :name="loading ? 'lucide:loader-2' : icon" class="h-5 w-5" :class="loading ? 'animate-spin' : ''" />
        </div>
        <div class="min-w-0">
          <p class="text-sm font-semibold text-[var(--ca-text)]">
            {{ fileName || placeholder }}
          </p>
          <p class="mt-1 text-xs leading-relaxed text-[var(--ca-muted)]">
            {{ helperText }}
          </p>
        </div>
      </div>

      <span class="ca-btn-secondary !px-3 !py-2 text-xs">
        {{ buttonLabel }}
      </span>
    </button>

    <div v-if="previewUrl" class="mt-3 overflow-hidden rounded-2xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] p-2">
      <img :src="previewUrl" :alt="previewAlt" class="h-32 w-full rounded-xl object-cover" />
    </div>

    <p v-if="error" class="mt-1 text-xs ca-field-error">
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
const { tc } = useConsoleI18n()

interface Props {
  id: string
  label?: string
  accept?: string
  placeholder?: string
  helperText?: string
  buttonText?: string
  loading?: boolean
  disabled?: boolean
  required?: boolean
  error?: string
  previewUrl?: string | null
  previewAlt?: string
  icon?: string
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  accept: '',
  placeholder: 'Pilih file',
  helperText: 'JPG, PNG, atau WEBP',
  buttonText: 'Pilih file',
  loading: false,
  disabled: false,
  required: false,
  error: '',
  previewUrl: null,
  previewAlt: 'Preview',
  icon: 'lucide:image-plus',
})

const emit = defineEmits<{
  select: [file: File]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const fileName = ref('')

const buttonLabel = computed(() => (props.loading ? tc('common.uploading') : props.buttonText))

const openPicker = () => {
  if (props.disabled || props.loading) return
  fileInput.value?.click()
}

const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  fileName.value = file.name
  emit('select', file)
  target.value = ''
}
</script>
