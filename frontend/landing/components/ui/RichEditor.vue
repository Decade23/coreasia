<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'

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

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit.configure({
      heading: { levels: [2, 3, 4] },
    }),
    Image.configure({ inline: false }),
    Link.configure({ openOnClick: false, HTMLAttributes: { class: 'ca-tone-gold underline' } }),
    Placeholder.configure({ placeholder: props.placeholder || 'Tulis konten di sini...' }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Underline,
  ],
  editorProps: {
    attributes: {
      class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px] px-4 py-3 text-[var(--ca-text)]',
    },
  },
  onUpdate: ({ editor: e }) => {
    emit('update:modelValue', e.getHTML())
  },
})

watch(() => props.modelValue, (val) => {
  if (editor.value && editor.value.getHTML() !== val) {
    editor.value.commands.setContent(val, false)
  }
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})

const addImage = () => {
  const url = window.prompt('URL gambar:')
  if (url && editor.value) {
    editor.value.chain().focus().setImage({ src: url }).run()
  }
}

const addLink = () => {
  if (!editor.value) return
  const prev = editor.value.getAttributes('link').href
  const url = window.prompt('URL link:', prev)
  if (url === null) return
  if (url === '') {
    editor.value.chain().focus().extendMarkRange('link').unsetLink().run()
  } else {
    editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }
}

type BtnDef = { icon: string; action: () => void; active?: () => boolean; title: string }

const toolbarGroups = computed<BtnDef[][]>(() => {
  if (!editor.value) return []
  const e = editor.value
  return [
    [
      { icon: 'lucide:bold', action: () => e.chain().focus().toggleBold().run(), active: () => e.isActive('bold'), title: 'Bold' },
      { icon: 'lucide:italic', action: () => e.chain().focus().toggleItalic().run(), active: () => e.isActive('italic'), title: 'Italic' },
      { icon: 'lucide:underline', action: () => e.chain().focus().toggleUnderline().run(), active: () => e.isActive('underline'), title: 'Underline' },
      { icon: 'lucide:strikethrough', action: () => e.chain().focus().toggleStrike().run(), active: () => e.isActive('strike'), title: 'Strikethrough' },
    ],
    [
      { icon: 'lucide:heading-2', action: () => e.chain().focus().toggleHeading({ level: 2 }).run(), active: () => e.isActive('heading', { level: 2 }), title: 'Heading 2' },
      { icon: 'lucide:heading-3', action: () => e.chain().focus().toggleHeading({ level: 3 }).run(), active: () => e.isActive('heading', { level: 3 }), title: 'Heading 3' },
    ],
    [
      { icon: 'lucide:list', action: () => e.chain().focus().toggleBulletList().run(), active: () => e.isActive('bulletList'), title: 'Bullet list' },
      { icon: 'lucide:list-ordered', action: () => e.chain().focus().toggleOrderedList().run(), active: () => e.isActive('orderedList'), title: 'Numbered list' },
      { icon: 'lucide:quote', action: () => e.chain().focus().toggleBlockquote().run(), active: () => e.isActive('blockquote'), title: 'Quote' },
    ],
    [
      { icon: 'lucide:code-2', action: () => e.chain().focus().toggleCode().run(), active: () => e.isActive('code'), title: 'Inline code' },
      { icon: 'lucide:file-code', action: () => e.chain().focus().toggleCodeBlock().run(), active: () => e.isActive('codeBlock'), title: 'Code block' },
    ],
    [
      { icon: 'lucide:link', action: addLink, active: () => e.isActive('link'), title: 'Link' },
      { icon: 'lucide:image', action: addImage, title: 'Image' },
      { icon: 'lucide:minus', action: () => e.chain().focus().setHorizontalRule().run(), title: 'Horizontal rule' },
    ],
    [
      { icon: 'lucide:undo-2', action: () => e.chain().focus().undo().run(), title: 'Undo' },
      { icon: 'lucide:redo-2', action: () => e.chain().focus().redo().run(), title: 'Redo' },
    ],
  ]
})
</script>

<template>
  <div>
    <label v-if="label" :for="id" class="ca-field-label">
      {{ label }}
      <span v-if="required" class="ca-required">*</span>
    </label>
    <div
      class="overflow-hidden rounded-xl border transition-colors"
      :class="error ? 'border-rose-300/50' : 'border-[color:var(--ca-border)] focus-within:border-amber-300/40'"
    >
      <!-- Toolbar -->
      <div v-if="editor" class="flex flex-wrap items-center gap-0.5 border-b border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] px-2 py-1.5">
        <template v-for="(group, gi) in toolbarGroups" :key="gi">
          <div v-if="gi > 0" class="mx-0.5 h-5 w-px bg-[var(--ca-border)]" />
          <button
            v-for="btn in group"
            :key="btn.title"
            type="button"
            class="rounded-md p-1.5 text-[var(--ca-muted)] transition hover:bg-[var(--ca-panel-bg-strong)] hover:text-[var(--ca-text)]"
            :class="btn.active?.() ? 'bg-[var(--ca-kicker-bg)] !text-brand-primary' : ''"
            :title="btn.title"
            @click="btn.action"
          >
            <Icon :name="btn.icon" class="h-4 w-4" />
          </button>
        </template>
      </div>

      <!-- Editor -->
      <div class="bg-[var(--ca-panel-bg)]" :style="{ minHeight: minHeight || '300px' }">
        <EditorContent :editor="editor" />
      </div>
    </div>
    <p v-if="error" class="ca-field-error mt-1">{{ error }}</p>
  </div>
</template>

<style>
/* Tiptap editor styling */
.tiptap {
  min-height: inherit;
}
.tiptap p.is-editor-empty:first-child::before {
  color: var(--ca-subtle);
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}
.tiptap h2 { font-size: 1.25rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.5rem; color: var(--ca-text); }
.tiptap h3 { font-size: 1.1rem; font-weight: 600; margin-top: 1.25rem; margin-bottom: 0.5rem; color: var(--ca-text); }
.tiptap h4 { font-size: 1rem; font-weight: 600; margin-top: 1rem; margin-bottom: 0.5rem; color: var(--ca-text); }
.tiptap p { margin-bottom: 0.5rem; line-height: 1.7; }
.tiptap ul, .tiptap ol { padding-left: 1.5rem; margin-bottom: 0.5rem; }
.tiptap ul { list-style-type: disc; }
.tiptap ol { list-style-type: decimal; }
.tiptap li { margin-bottom: 0.25rem; }
.tiptap blockquote { border-left: 3px solid var(--ca-border); padding-left: 1rem; margin: 0.75rem 0; color: var(--ca-muted); font-style: italic; }
.tiptap pre { background: var(--ca-panel-bg-strong); border-radius: 0.5rem; padding: 0.75rem 1rem; margin: 0.75rem 0; overflow-x: auto; font-size: 0.85rem; }
.tiptap code { background: var(--ca-panel-bg-strong); border-radius: 0.25rem; padding: 0.15rem 0.35rem; font-size: 0.85rem; }
.tiptap pre code { background: none; padding: 0; font-size: inherit; }
.tiptap img { max-width: 100%; height: auto; border-radius: 0.5rem; margin: 0.75rem 0; }
.tiptap hr { border-color: var(--ca-border); margin: 1.5rem 0; }
.tiptap a { color: var(--ca-gold); text-decoration: underline; }
</style>
