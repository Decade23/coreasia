<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'

const { tc } = useConsoleI18n()

const props = defineProps<{
  modelValue: string
  id?: string
  label?: string
  placeholder?: string
  required?: boolean
  error?: string
  minHeight?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

type ToolbarMenu = 'style' | 'align' | null
type ToolbarAction = {
  icon: string
  title: string
  action: () => void
  active?: () => boolean
  disabled?: () => boolean
}
type MenuOption = {
  icon: string
  label: string
  description: string
  action: () => void
  active: () => boolean
}

const showLinkModal = ref(false)
const showImageModal = ref(false)
const linkUrl = ref('')
const imageUrl = ref('')
const activeMenu = ref<ToolbarMenu>(null)
const editorVersion = ref(0)

const linkBubble = ref<{ show: boolean; href: string; top: number; left: number }>({
  show: false,
  href: '',
  top: 0,
  left: 0,
})

const editorContainer = ref<HTMLElement | null>(null)

const syncEditorState = () => {
  editorVersion.value += 1
}

const closeToolbarMenus = () => {
  activeMenu.value = null
}

const toggleToolbarMenu = (menu: Exclude<ToolbarMenu, null>) => {
  activeMenu.value = activeMenu.value === menu ? null : menu
}

const closeOverlays = () => {
  activeMenu.value = null
  linkBubble.value.show = false
}

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit.configure({
      heading: { levels: [2, 3, 4] },
    }),
    Image.configure({ inline: false }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'ca-tone-gold underline cursor-pointer',
      },
    }),
    Placeholder.configure({
      placeholder: props.placeholder || tc('editor.placeholder'),
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
      alignments: ['left', 'center', 'right', 'justify'],
    }),
    Underline,
  ],
  editorProps: {
    attributes: {
      class: 'tiptap tiptap-doc focus:outline-none text-[var(--ca-text)]',
    },
    handleClick: (_view, _pos, event) => {
      const target = event.target as HTMLElement
      const linkEl = target.closest('a')

      closeToolbarMenus()

      if (linkEl && editorContainer.value) {
        const containerRect = editorContainer.value.getBoundingClientRect()
        const linkRect = linkEl.getBoundingClientRect()
        linkBubble.value = {
          show: true,
          href: linkEl.getAttribute('href') || '',
          top: linkRect.bottom - containerRect.top + 8,
          left: Math.max(16, linkRect.left - containerRect.left - 8),
        }
        return false
      }

      linkBubble.value.show = false
      return false
    },
  },
  onCreate: syncEditorState,
  onUpdate: ({ editor: instance }) => {
    emit('update:modelValue', instance.getHTML())
    syncEditorState()
  },
  onSelectionUpdate: () => {
    if (editor.value && !editor.value.isActive('link')) {
      linkBubble.value.show = false
    }
    syncEditorState()
  },
})

watch(
  () => props.modelValue,
  (val) => {
    if (editor.value && editor.value.getHTML() !== val) {
      editor.value.commands.setContent(val, false)
      syncEditorState()
    }
  },
)

onClickOutside(editorContainer, () => {
  closeOverlays()
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})

const focusEditor = () => {
  editor.value?.chain().focus().run()
}

const openLinkModal = () => {
  if (!editor.value) return

  linkUrl.value = editor.value.getAttributes('link').href || ''
  closeOverlays()
  showLinkModal.value = true
}

const confirmLink = () => {
  if (!editor.value) return

  showLinkModal.value = false

  if (linkUrl.value === '') {
    editor.value.chain().focus().extendMarkRange('link').unsetLink().run()
  } else {
    editor.value.chain().focus().extendMarkRange('link').setLink({ href: linkUrl.value }).run()
  }

  linkUrl.value = ''
  syncEditorState()
}

const removeLink = () => {
  if (!editor.value) return

  editor.value.chain().focus().extendMarkRange('link').unsetLink().run()
  linkBubble.value.show = false
  syncEditorState()
}

const editLinkFromBubble = () => {
  linkUrl.value = linkBubble.value.href
  linkBubble.value.show = false
  showLinkModal.value = true
}

const openImageModal = () => {
  imageUrl.value = ''
  closeOverlays()
  showImageModal.value = true
}

const confirmImage = () => {
  if (!editor.value || !imageUrl.value) return

  showImageModal.value = false
  editor.value.chain().focus().setImage({ src: imageUrl.value }).run()
  imageUrl.value = ''
  syncEditorState()
}

const clearFormatting = () => {
  if (!editor.value) return

  editor.value.chain().focus().unsetAllMarks().clearNodes().run()
  syncEditorState()
}

const documentText = computed(() => {
  editorVersion.value
  return editor.value?.getText().replace(/\u00a0/g, ' ').trim() || ''
})

const wordCount = computed(() => {
  const text = documentText.value
  return text ? text.split(/\s+/).filter(Boolean).length : 0
})

const characterCount = computed(() => documentText.value.length)
const readingMinutes = computed(() => Math.max(1, Math.ceil(wordCount.value / 200)))

const currentBlockStyleKey = computed(() => {
  editorVersion.value

  if (!editor.value) return 'paragraph'
  if (editor.value.isActive('heading', { level: 2 })) return 'heading2'
  if (editor.value.isActive('heading', { level: 3 })) return 'heading3'
  if (editor.value.isActive('heading', { level: 4 })) return 'heading4'
  if (editor.value.isActive('blockquote')) return 'quote'
  if (editor.value.isActive('codeBlock')) return 'codeBlock'
  return 'paragraph'
})

const currentAlignmentKey = computed(() => {
  editorVersion.value

  if (!editor.value) return 'left'
  if (editor.value.isActive({ textAlign: 'center' })) return 'center'
  if (editor.value.isActive({ textAlign: 'right' })) return 'right'
  if (editor.value.isActive({ textAlign: 'justify' })) return 'justify'
  return 'left'
})

const currentBlockStyleLabel = computed(() => {
  const labels: Record<string, string> = {
    paragraph: tc('editor.styles.paragraph'),
    heading2: tc('editor.styles.heading2'),
    heading3: tc('editor.styles.heading3'),
    heading4: tc('editor.styles.heading4'),
    quote: tc('editor.styles.quote'),
    codeBlock: tc('editor.styles.codeBlock'),
  }

  return labels[currentBlockStyleKey.value] || tc('editor.styles.paragraph')
})

const currentAlignmentLabel = computed(() => {
  const labels: Record<string, string> = {
    left: tc('editor.align.left'),
    center: tc('editor.align.center'),
    right: tc('editor.align.right'),
    justify: tc('editor.align.justify'),
  }

  return labels[currentAlignmentKey.value] || tc('editor.align.left')
})

const styleOptions = computed<MenuOption[]>(() => {
  if (!editor.value) return []

  return [
    {
      icon: 'lucide:type',
      label: tc('editor.styles.paragraph'),
      description: tc('editor.styles.paragraphDesc'),
      action: () => editor.value?.chain().focus().setParagraph().run(),
      active: () => editor.value?.isActive('paragraph') ?? false,
    },
    {
      icon: 'lucide:heading-2',
      label: tc('editor.styles.heading2'),
      description: tc('editor.styles.heading2Desc'),
      action: () => editor.value?.chain().focus().toggleHeading({ level: 2 }).run(),
      active: () => editor.value?.isActive('heading', { level: 2 }) ?? false,
    },
    {
      icon: 'lucide:heading-3',
      label: tc('editor.styles.heading3'),
      description: tc('editor.styles.heading3Desc'),
      action: () => editor.value?.chain().focus().toggleHeading({ level: 3 }).run(),
      active: () => editor.value?.isActive('heading', { level: 3 }) ?? false,
    },
    {
      icon: 'lucide:heading-4',
      label: tc('editor.styles.heading4'),
      description: tc('editor.styles.heading4Desc'),
      action: () => editor.value?.chain().focus().toggleHeading({ level: 4 }).run(),
      active: () => editor.value?.isActive('heading', { level: 4 }) ?? false,
    },
    {
      icon: 'lucide:quote',
      label: tc('editor.styles.quote'),
      description: tc('editor.styles.quoteDesc'),
      action: () => editor.value?.chain().focus().toggleBlockquote().run(),
      active: () => editor.value?.isActive('blockquote') ?? false,
    },
    {
      icon: 'lucide:file-code',
      label: tc('editor.styles.codeBlock'),
      description: tc('editor.styles.codeBlockDesc'),
      action: () => editor.value?.chain().focus().toggleCodeBlock().run(),
      active: () => editor.value?.isActive('codeBlock') ?? false,
    },
  ]
})

const alignmentOptions = computed<MenuOption[]>(() => {
  if (!editor.value) return []

  return [
    {
      icon: 'lucide:align-left',
      label: tc('editor.align.left'),
      description: tc('editor.align.leftDesc'),
      action: () => editor.value?.chain().focus().setTextAlign('left').run(),
      active: () => currentAlignmentKey.value === 'left',
    },
    {
      icon: 'lucide:align-center',
      label: tc('editor.align.center'),
      description: tc('editor.align.centerDesc'),
      action: () => editor.value?.chain().focus().setTextAlign('center').run(),
      active: () => currentAlignmentKey.value === 'center',
    },
    {
      icon: 'lucide:align-right',
      label: tc('editor.align.right'),
      description: tc('editor.align.rightDesc'),
      action: () => editor.value?.chain().focus().setTextAlign('right').run(),
      active: () => currentAlignmentKey.value === 'right',
    },
    {
      icon: 'lucide:align-justify',
      label: tc('editor.align.justify'),
      description: tc('editor.align.justifyDesc'),
      action: () => editor.value?.chain().focus().setTextAlign('justify').run(),
      active: () => currentAlignmentKey.value === 'justify',
    },
  ]
})

const formattingButtons = computed<ToolbarAction[]>(() => {
  if (!editor.value) return []

  const instance = editor.value

  return [
    {
      icon: 'lucide:bold',
      title: tc('editor.actions.bold'),
      action: () => instance.chain().focus().toggleBold().run(),
      active: () => instance.isActive('bold'),
    },
    {
      icon: 'lucide:italic',
      title: tc('editor.actions.italic'),
      action: () => instance.chain().focus().toggleItalic().run(),
      active: () => instance.isActive('italic'),
    },
    {
      icon: 'lucide:underline',
      title: tc('editor.actions.underline'),
      action: () => instance.chain().focus().toggleUnderline().run(),
      active: () => instance.isActive('underline'),
    },
    {
      icon: 'lucide:strikethrough',
      title: tc('editor.actions.strikethrough'),
      action: () => instance.chain().focus().toggleStrike().run(),
      active: () => instance.isActive('strike'),
    },
    {
      icon: 'lucide:code-2',
      title: tc('editor.actions.inlineCode'),
      action: () => instance.chain().focus().toggleCode().run(),
      active: () => instance.isActive('code'),
    },
  ]
})

const paragraphButtons = computed<ToolbarAction[]>(() => {
  if (!editor.value) return []

  const instance = editor.value

  return [
    {
      icon: 'lucide:list',
      title: tc('editor.actions.bulletList'),
      action: () => instance.chain().focus().toggleBulletList().run(),
      active: () => instance.isActive('bulletList'),
    },
    {
      icon: 'lucide:list-ordered',
      title: tc('editor.actions.orderedList'),
      action: () => instance.chain().focus().toggleOrderedList().run(),
      active: () => instance.isActive('orderedList'),
    },
    {
      icon: 'lucide:quote',
      title: tc('editor.actions.quote'),
      action: () => instance.chain().focus().toggleBlockquote().run(),
      active: () => instance.isActive('blockquote'),
    },
    {
      icon: 'lucide:eraser',
      title: tc('editor.actions.clearFormatting'),
      action: clearFormatting,
    },
  ]
})

const insertButtons = computed<ToolbarAction[]>(() => {
  if (!editor.value) return []

  return [
    {
      icon: 'lucide:link',
      title: tc('editor.actions.link'),
      action: openLinkModal,
      active: () => editor.value?.isActive('link') ?? false,
    },
    {
      icon: 'lucide:image',
      title: tc('editor.actions.image'),
      action: openImageModal,
    },
    {
      icon: 'lucide:minus',
      title: tc('editor.actions.divider'),
      action: () => editor.value?.chain().focus().setHorizontalRule().run(),
    },
  ]
})

const historyButtons = computed<ToolbarAction[]>(() => {
  if (!editor.value) return []

  const instance = editor.value

  return [
    {
      icon: 'lucide:undo-2',
      title: tc('editor.actions.undo'),
      action: () => instance.chain().focus().undo().run(),
      disabled: () => !instance.can().chain().focus().undo().run(),
    },
    {
      icon: 'lucide:redo-2',
      title: tc('editor.actions.redo'),
      action: () => instance.chain().focus().redo().run(),
      disabled: () => !instance.can().chain().focus().redo().run(),
    },
  ]
})

const applyMenuOption = (option: MenuOption) => {
  option.action()
  activeMenu.value = null
  syncEditorState()
}

const runToolbarAction = (action: ToolbarAction) => {
  if (action.disabled?.()) return
  action.action()
  syncEditorState()
}
</script>

<template>
  <div>
    <label v-if="label" :for="id" class="ca-field-label">
      {{ label }}
      <span v-if="required" class="ca-required">*</span>
    </label>

    <div
      ref="editorContainer"
      class="ca-editor-shell relative overflow-hidden rounded-[1.75rem] border transition-colors"
      :class="error ? 'border-rose-300/50' : 'border-[color:var(--ca-border)] focus-within:border-amber-300/40'"
    >
      <div class="ca-editor-header border-b border-[color:var(--ca-border)] px-4 py-4 sm:px-6">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-[var(--ca-subtle)]">
              {{ tc('editor.workspaceKicker') }}
            </p>
            <h3 class="mt-1 font-display text-lg font-bold text-[var(--ca-text)]">
              {{ tc('editor.workspaceTitle') }}
            </h3>
            <p class="mt-1 max-w-2xl text-sm text-[var(--ca-muted)]">
              {{ tc('editor.workspaceDescription') }}
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <span class="ca-badge ca-badge-gold">
              <Icon name="lucide:type" class="h-3.5 w-3.5" />
              {{ currentBlockStyleLabel }}
            </span>
            <span class="ca-badge">
              <Icon name="lucide:align-left" class="h-3.5 w-3.5" />
              {{ currentAlignmentLabel }}
            </span>
            <span class="ca-badge">
              <Icon name="lucide:languages" class="h-3.5 w-3.5" />
              {{ tc('editor.keyboardHint') }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="editor" class="ca-editor-ribbon border-b border-[color:var(--ca-border)] px-4 py-4 sm:px-6">
        <div class="flex flex-wrap items-start gap-4">
          <section class="ca-editor-section">
            <p class="ca-editor-section-label">{{ tc('editor.sections.layout') }}</p>
            <div class="flex flex-wrap items-center gap-2">
              <div class="relative">
                <button
                  type="button"
                  class="ca-editor-trigger"
                  :class="activeMenu === 'style' ? 'ca-editor-trigger-active' : ''"
                  @click="toggleToolbarMenu('style')"
                >
                  <Icon name="lucide:type" class="h-4 w-4" />
                  <span class="truncate">{{ currentBlockStyleLabel }}</span>
                  <Icon name="lucide:chevron-down" class="h-4 w-4 text-[var(--ca-subtle)]" />
                </button>

                <div v-if="activeMenu === 'style'" class="ca-editor-menu">
                  <button
                    v-for="option in styleOptions"
                    :key="option.label"
                    type="button"
                    class="ca-editor-menu-item"
                    :class="option.active() ? 'ca-editor-menu-item-active' : ''"
                    @click="applyMenuOption(option)"
                  >
                    <Icon :name="option.icon" class="h-4 w-4 shrink-0" />
                    <div class="min-w-0 text-left">
                      <p class="text-sm font-semibold text-[var(--ca-text)]">{{ option.label }}</p>
                      <p class="text-xs text-[var(--ca-subtle)]">{{ option.description }}</p>
                    </div>
                  </button>
                </div>
              </div>

              <div class="relative">
                <button
                  type="button"
                  class="ca-editor-trigger"
                  :class="activeMenu === 'align' ? 'ca-editor-trigger-active' : ''"
                  @click="toggleToolbarMenu('align')"
                >
                  <Icon
                    :name="{
                      left: 'lucide:align-left',
                      center: 'lucide:align-center',
                      right: 'lucide:align-right',
                      justify: 'lucide:align-justify',
                    }[currentAlignmentKey]"
                    class="h-4 w-4"
                  />
                  <span class="truncate">{{ currentAlignmentLabel }}</span>
                  <Icon name="lucide:chevron-down" class="h-4 w-4 text-[var(--ca-subtle)]" />
                </button>

                <div v-if="activeMenu === 'align'" class="ca-editor-menu">
                  <button
                    v-for="option in alignmentOptions"
                    :key="option.label"
                    type="button"
                    class="ca-editor-menu-item"
                    :class="option.active() ? 'ca-editor-menu-item-active' : ''"
                    @click="applyMenuOption(option)"
                  >
                    <Icon :name="option.icon" class="h-4 w-4 shrink-0" />
                    <div class="min-w-0 text-left">
                      <p class="text-sm font-semibold text-[var(--ca-text)]">{{ option.label }}</p>
                      <p class="text-xs text-[var(--ca-subtle)]">{{ option.description }}</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section class="ca-editor-section">
            <p class="ca-editor-section-label">{{ tc('editor.sections.format') }}</p>
            <div class="ca-editor-button-group">
              <button
                v-for="btn in formattingButtons"
                :key="btn.title"
                type="button"
                class="ca-editor-btn"
                :class="btn.active?.() ? 'ca-editor-btn-active' : ''"
                :title="btn.title"
                @click="runToolbarAction(btn)"
              >
                <Icon :name="btn.icon" class="h-4 w-4" />
              </button>
            </div>
          </section>

          <section class="ca-editor-section">
            <p class="ca-editor-section-label">{{ tc('editor.sections.paragraph') }}</p>
            <div class="ca-editor-button-group">
              <button
                v-for="btn in paragraphButtons"
                :key="btn.title"
                type="button"
                class="ca-editor-btn"
                :class="btn.active?.() ? 'ca-editor-btn-active' : ''"
                :title="btn.title"
                @click="runToolbarAction(btn)"
              >
                <Icon :name="btn.icon" class="h-4 w-4" />
              </button>
            </div>
          </section>

          <section class="ca-editor-section">
            <p class="ca-editor-section-label">{{ tc('editor.sections.insert') }}</p>
            <div class="ca-editor-button-group">
              <button
                v-for="btn in insertButtons"
                :key="btn.title"
                type="button"
                class="ca-editor-btn"
                :class="btn.active?.() ? 'ca-editor-btn-active' : ''"
                :title="btn.title"
                @click="runToolbarAction(btn)"
              >
                <Icon :name="btn.icon" class="h-4 w-4" />
              </button>
            </div>
          </section>

          <section class="ca-editor-section sm:ml-auto">
            <p class="ca-editor-section-label">{{ tc('editor.sections.history') }}</p>
            <div class="ca-editor-button-group">
              <button
                v-for="btn in historyButtons"
                :key="btn.title"
                type="button"
                class="ca-editor-btn"
                :disabled="btn.disabled?.()"
                :class="btn.disabled?.() ? 'ca-editor-btn-disabled' : ''"
                :title="btn.title"
                @click="runToolbarAction(btn)"
              >
                <Icon :name="btn.icon" class="h-4 w-4" />
              </button>
            </div>
          </section>
        </div>
      </div>

      <div class="ca-editor-stage px-3 py-4 sm:px-6 sm:py-6">
        <div class="ca-editor-ruler" aria-hidden="true">
          <span
            v-for="tick in 17"
            :key="tick"
            class="ca-editor-ruler-tick"
            :class="tick % 4 === 1 ? 'ca-editor-ruler-tick-major' : ''"
          />
        </div>

        <div class="ca-editor-sheet-wrap">
          <div class="ca-editor-sheet" :style="{ minHeight: minHeight || '460px' }" @click="focusEditor">
            <div class="ca-editor-sheet-meta">
              <div class="flex items-center gap-2">
                <Icon name="lucide:file-text" class="h-4 w-4 text-[var(--ca-gold-text)]" />
                <span>{{ tc('editor.documentLabel') }}</span>
              </div>
              <span>{{ tc('editor.readingTime', { count: readingMinutes }) }}</span>
            </div>

            <EditorContent :editor="editor" />
          </div>
        </div>
      </div>

      <div class="ca-editor-status border-t border-[color:var(--ca-border)] px-4 py-3 sm:px-6">
        <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--ca-muted)]">
          <span class="inline-flex items-center gap-1.5">
            <Icon name="lucide:type" class="h-3.5 w-3.5" />
            {{ tc('editor.wordCount', { count: wordCount }) }}
          </span>
          <span class="inline-flex items-center gap-1.5">
            <Icon name="lucide:hash" class="h-3.5 w-3.5" />
            {{ tc('editor.characterCount', { count: characterCount }) }}
          </span>
          <span class="inline-flex items-center gap-1.5">
            <Icon name="lucide:book-open" class="h-3.5 w-3.5" />
            {{ tc('editor.readingTime', { count: readingMinutes }) }}
          </span>
          <span class="inline-flex items-center gap-1.5">
            <Icon name="lucide:sparkles" class="h-3.5 w-3.5" />
            {{ tc('editor.statusReady') }}
          </span>
        </div>
      </div>

      <div
        v-if="linkBubble.show"
        class="absolute z-20 flex max-w-[min(18rem,calc(100%-2rem))] items-center gap-1.5 rounded-xl border border-[color:var(--ca-border)] bg-[color:var(--ca-panel-bg-strong)] px-3 py-2 shadow-2xl backdrop-blur"
        :style="{ top: `${linkBubble.top}px`, left: `${linkBubble.left}px` }"
      >
        <Icon name="lucide:link" class="h-3.5 w-3.5 shrink-0 text-[var(--ca-subtle)]" />
        <a
          :href="linkBubble.href"
          target="_blank"
          rel="noopener noreferrer"
          class="max-w-[11rem] truncate text-xs text-amber-400 underline"
          :title="linkBubble.href"
        >
          {{ linkBubble.href }}
        </a>
        <div class="ml-1 flex items-center gap-1">
          <button type="button" class="ca-editor-bubble-btn" :title="tc('editor.actions.editLink')" @click="editLinkFromBubble">
            <Icon name="lucide:edit-3" class="h-3.5 w-3.5" />
          </button>
          <button type="button" class="ca-editor-bubble-btn ca-editor-bubble-btn-danger" :title="tc('editor.actions.removeLink')" @click="removeLink">
            <Icon name="lucide:unlink" class="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>

    <p v-if="error" class="ca-field-error mt-1">{{ error }}</p>

    <Teleport to="body">
      <div v-if="showLinkModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" @click.self="showLinkModal = false">
        <div class="ca-card w-full max-w-md p-6">
          <h3 class="font-display text-lg font-bold text-[var(--ca-text)]">
            <Icon name="lucide:link" class="mr-2 inline h-5 w-5 text-amber-400" />
            {{ linkUrl ? tc('editor.editLinkTitle') : tc('editor.insertLinkTitle') }}
          </h3>
          <div class="mt-4">
            <BaseInput
              id="editor-link-url"
              v-model="linkUrl"
              type="url"
              :label="tc('editor.linkUrlLabel')"
              :placeholder="tc('editor.linkUrlPlaceholder')"
              @keydown.enter.prevent="confirmLink"
            />
            <p class="mt-1 text-[0.7rem] text-[var(--ca-subtle)]">{{ tc('editor.linkHint') }}</p>
          </div>
          <div class="mt-5 flex justify-end gap-3">
            <button type="button" class="ca-btn-secondary" @click="showLinkModal = false">{{ tc('common.cancel') }}</button>
            <button type="button" class="ca-btn-primary" @click="confirmLink">{{ tc('common.save') }}</button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="showImageModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" @click.self="showImageModal = false">
        <div class="ca-card w-full max-w-md p-6">
          <h3 class="font-display text-lg font-bold text-[var(--ca-text)]">
            <Icon name="lucide:image" class="mr-2 inline h-5 w-5 text-amber-400" />
            {{ tc('editor.insertImageTitle') }}
          </h3>
          <div class="mt-4">
            <BaseInput
              id="editor-image-url"
              v-model="imageUrl"
              type="url"
              :label="tc('editor.imageUrlLabel')"
              :placeholder="tc('editor.imageUrlPlaceholder')"
              @keydown.enter.prevent="confirmImage"
            />
          </div>
          <div v-if="imageUrl" class="mt-4 overflow-hidden rounded-2xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] p-2">
            <img
              :src="imageUrl"
              class="h-40 w-full rounded-xl object-cover"
              @error="($event.target as HTMLImageElement).style.display = 'none'"
            />
          </div>
          <div class="mt-5 flex justify-end gap-3">
            <button type="button" class="ca-btn-secondary" @click="showImageModal = false">{{ tc('common.cancel') }}</button>
            <button type="button" class="ca-btn-primary" :disabled="!imageUrl" @click="confirmImage">{{ tc('editor.insertImageAction') }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style>
.ca-editor-shell {
  background:
    radial-gradient(circle at top left, color-mix(in srgb, var(--ca-gold-border) 40%, transparent) 0%, transparent 28%),
    linear-gradient(180deg, color-mix(in srgb, var(--ca-bg-soft) 84%, transparent), color-mix(in srgb, var(--ca-bg) 90%, transparent));
  box-shadow: var(--ca-card-soft-shadow);
}

.ca-editor-header,
.ca-editor-ribbon,
.ca-editor-status {
  background: color-mix(in srgb, var(--ca-panel-bg) 92%, transparent);
  backdrop-filter: blur(14px);
}

.ca-editor-section {
  min-width: 0;
}

.ca-editor-section-label {
  margin-bottom: 0.5rem;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ca-subtle);
}

.ca-editor-trigger,
.ca-editor-btn,
.ca-editor-bubble-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  border: 1px solid color-mix(in srgb, var(--ca-border) 92%, transparent);
  background: color-mix(in srgb, var(--ca-surface) 94%, transparent);
  color: var(--ca-muted);
  transition: all 160ms ease;
}

.ca-editor-trigger {
  min-width: 11.5rem;
  max-width: 15rem;
  border-radius: 0.95rem;
  padding: 0.7rem 0.9rem;
  font-size: 0.85rem;
  font-weight: 600;
}

.ca-editor-trigger:hover,
.ca-editor-btn:hover,
.ca-editor-bubble-btn:hover {
  border-color: color-mix(in srgb, var(--ca-gold-border) 78%, var(--ca-border));
  background: color-mix(in srgb, var(--ca-kicker-bg) 92%, transparent);
  color: var(--ca-text);
}

.ca-editor-trigger-active,
.ca-editor-btn-active {
  border-color: var(--ca-gold-border);
  background: var(--ca-gold-bg);
  color: var(--ca-gold-text);
  box-shadow: 0 12px 28px color-mix(in srgb, var(--ca-gold-border) 20%, transparent);
}

.ca-editor-btn {
  height: 2.5rem;
  width: 2.5rem;
  border-radius: 0.95rem;
}

.ca-editor-btn-disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.ca-editor-button-group {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.ca-editor-menu {
  position: absolute;
  top: calc(100% + 0.65rem);
  left: 0;
  z-index: 30;
  width: min(20rem, calc(100vw - 3rem));
  border: 1px solid color-mix(in srgb, var(--ca-border) 96%, transparent);
  border-radius: 1.1rem;
  background: color-mix(in srgb, var(--ca-surface) 96%, transparent);
  box-shadow: var(--ca-card-shadow);
  padding: 0.45rem;
  backdrop-filter: blur(20px);
}

.ca-editor-menu-item {
  display: flex;
  width: 100%;
  align-items: flex-start;
  gap: 0.8rem;
  border-radius: 0.95rem;
  padding: 0.75rem 0.8rem;
  color: var(--ca-muted);
  transition: all 160ms ease;
}

.ca-editor-menu-item:hover {
  background: color-mix(in srgb, var(--ca-kicker-bg) 92%, transparent);
  color: var(--ca-text);
}

.ca-editor-menu-item-active {
  background: var(--ca-gold-bg);
  color: var(--ca-gold-text);
}

.ca-editor-stage {
  background:
    radial-gradient(circle at top, color-mix(in srgb, var(--ca-spotlight) 72%, transparent), transparent 42%),
    linear-gradient(180deg, color-mix(in srgb, var(--ca-bg-soft) 88%, transparent), color-mix(in srgb, var(--ca-bg) 96%, transparent));
}

.ca-editor-ruler {
  display: grid;
  grid-template-columns: repeat(17, minmax(0, 1fr));
  gap: 0.75rem;
  margin: 0 auto 1.25rem;
  max-width: 56rem;
  padding: 0 1rem;
}

.ca-editor-ruler-tick {
  display: block;
  height: 0.65rem;
  border-left: 1px solid color-mix(in srgb, var(--ca-border) 88%, transparent);
}

.ca-editor-ruler-tick-major {
  height: 0.95rem;
  border-left-color: color-mix(in srgb, var(--ca-gold-border) 76%, var(--ca-border));
}

.ca-editor-sheet-wrap {
  display: flex;
  justify-content: center;
}

.ca-editor-sheet {
  width: min(100%, 56rem);
  border: 1px solid color-mix(in srgb, var(--ca-border) 96%, transparent);
  border-radius: 1.6rem;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--ca-surface) 98%, white), color-mix(in srgb, var(--ca-surface-soft) 96%, white));
  box-shadow: 0 28px 50px rgba(15, 23, 42, 0.2);
  overflow: hidden;
}

.dark .ca-editor-sheet {
  box-shadow: 0 30px 70px rgba(2, 6, 23, 0.38);
}

.ca-editor-sheet-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border-bottom: 1px dashed color-mix(in srgb, var(--ca-border) 86%, transparent);
  padding: 1rem 1.4rem;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--ca-subtle);
}

.ca-editor-status {
  background: color-mix(in srgb, var(--ca-bg-soft) 68%, var(--ca-panel-bg));
}

.ca-editor-bubble-btn {
  height: 1.9rem;
  width: 1.9rem;
  border-radius: 0.7rem;
}

.ca-editor-bubble-btn-danger {
  color: var(--ca-danger-text);
}

.ca-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border: 1px solid color-mix(in srgb, var(--ca-border) 90%, transparent);
  border-radius: 9999px;
  background: color-mix(in srgb, var(--ca-panel-bg-strong) 88%, transparent);
  padding: 0.45rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--ca-muted);
}

.ca-badge-gold {
  border-color: var(--ca-gold-border);
  background: var(--ca-gold-bg);
  color: var(--ca-gold-text);
}

.tiptap-doc {
  min-height: inherit;
  padding: 2rem clamp(1.1rem, 4vw, 3.75rem) 3rem;
  font-family: "Plus Jakarta Sans", "Inter", sans-serif;
  font-size: 1.03rem;
  line-height: 1.85;
}

.tiptap-doc p.is-editor-empty:first-child::before {
  color: var(--ca-subtle);
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

.tiptap-doc h2 {
  margin: 1.9rem 0 0.8rem;
  font-size: clamp(1.45rem, 1.2rem + 0.8vw, 1.95rem);
  font-weight: 800;
  line-height: 1.2;
  color: var(--ca-text);
}

.tiptap-doc h3 {
  margin: 1.5rem 0 0.7rem;
  font-size: clamp(1.18rem, 1.05rem + 0.45vw, 1.45rem);
  font-weight: 700;
  line-height: 1.3;
  color: var(--ca-text);
}

.tiptap-doc h4 {
  margin: 1.2rem 0 0.6rem;
  font-size: 1.04rem;
  font-weight: 700;
  line-height: 1.45;
  letter-spacing: 0.02em;
  color: var(--ca-text);
}

.tiptap-doc p {
  margin: 0 0 0.9rem;
}

.tiptap-doc ul,
.tiptap-doc ol {
  margin: 0.2rem 0 1rem;
  padding-left: 1.85rem;
}

.tiptap-doc ul {
  list-style-type: disc;
}

.tiptap-doc ol {
  list-style-type: decimal;
}

.tiptap-doc li {
  margin-bottom: 0.4rem;
}

.tiptap-doc blockquote {
  margin: 1.3rem 0;
  border-left: 4px solid var(--ca-gold-border);
  background: color-mix(in srgb, var(--ca-gold-bg) 62%, transparent);
  border-radius: 0 1rem 1rem 0;
  padding: 1rem 1.15rem;
  color: color-mix(in srgb, var(--ca-text) 92%, var(--ca-muted));
  font-style: italic;
}

.tiptap-doc pre {
  margin: 1.2rem 0;
  overflow-x: auto;
  border: 1px solid color-mix(in srgb, var(--ca-border) 94%, transparent);
  border-radius: 1rem;
  background: color-mix(in srgb, var(--ca-bg-soft) 78%, transparent);
  padding: 0.9rem 1rem;
  font-size: 0.88rem;
  line-height: 1.7;
}

.tiptap-doc code {
  border-radius: 0.45rem;
  background: color-mix(in srgb, var(--ca-panel-bg-strong) 82%, transparent);
  padding: 0.15rem 0.4rem;
  font-size: 0.88rem;
}

.tiptap-doc pre code {
  background: transparent;
  padding: 0;
}

.tiptap-doc img {
  max-width: 100%;
  height: auto;
  margin: 1.4rem auto;
  border-radius: 1rem;
  border: 1px solid color-mix(in srgb, var(--ca-border) 94%, transparent);
  box-shadow: var(--ca-card-soft-shadow);
}

.tiptap-doc hr {
  margin: 2rem 0;
  border: none;
  border-top: 1px solid color-mix(in srgb, var(--ca-border) 92%, transparent);
}

.tiptap-doc a {
  color: var(--ca-gold-text);
  text-decoration: underline;
  text-decoration-thickness: 1.5px;
  text-underline-offset: 0.16em;
}

@media (max-width: 640px) {
  .ca-editor-trigger {
    min-width: 0;
    width: 100%;
    max-width: none;
  }

  .ca-editor-menu {
    width: min(100vw - 3rem, 20rem);
  }

  .tiptap-doc {
    padding: 1.25rem 1rem 2rem;
    font-size: 0.98rem;
    line-height: 1.75;
  }
}
</style>
