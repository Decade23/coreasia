<script setup lang="ts">
definePageMeta({ layout: 'console', middleware: 'console' })

const { items, loading, saving, error, totalItems, fetchUsers, createUser, updateUser, deleteUser } = useAdminUsers()
const { user: currentAdmin } = useAdminAuth()

const showFormModal = ref(false)
const showDeleteConfirm = ref(false)
const editingUser = ref<any>(null)
const deletingUser = ref<any>(null)

const formData = ref({ email: '', full_name: '', role: 'admin' })
const showPasswordModal = ref(false)
const passwordTarget = ref<any>(null)
const passwordForm = ref({ password: '', confirm_password: '' })
const passwordError = ref('')

onMounted(() => fetchUsers())

const openCreate = () => {
  editingUser.value = null
  formData.value = { email: '', full_name: '', role: 'admin' }
  showFormModal.value = true
}

const openEdit = (u: any) => {
  editingUser.value = u
  formData.value = { email: u.email, full_name: u.full_name, role: u.role }
  showFormModal.value = true
}

const openPasswordChange = (u: any) => {
  passwordTarget.value = u
  passwordForm.value = { password: '', confirm_password: '' }
  passwordError.value = ''
  showPasswordModal.value = true
}

const handleSubmit = async () => {
  const data: Record<string, any> = { email: formData.value.email, full_name: formData.value.full_name, role: formData.value.role }
  let ok: boolean
  if (editingUser.value) {
    ok = await updateUser(editingUser.value.id, data)
  } else {
    ok = await createUser(data)
  }
  if (ok) {
    showFormModal.value = false
    fetchUsers()
  }
}

const handlePasswordChange = async () => {
  passwordError.value = ''
  if (passwordForm.value.password.length < 6) {
    passwordError.value = 'Password minimal 6 karakter'
    return
  }
  if (passwordForm.value.password !== passwordForm.value.confirm_password) {
    passwordError.value = 'Konfirmasi password tidak cocok'
    return
  }
  const ok = await updateUser(passwordTarget.value.id, { password: passwordForm.value.password })
  if (ok) {
    showPasswordModal.value = false
    fetchUsers()
  }
}

const handleDelete = (u: any) => {
  deletingUser.value = u
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  const ok = await deleteUser(deletingUser.value.id)
  showDeleteConfirm.value = false
  if (ok) fetchUsers()
}

const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="font-display text-2xl font-bold text-[var(--ca-text)]">Admin Users</h1>
        <p class="mt-1 text-sm text-[var(--ca-muted)]">Kelola akun admin</p>
      </div>
      <button v-if="currentAdmin?.role === 'super_admin'" type="button" class="ca-btn-primary" @click="openCreate">
        <Icon name="lucide:plus" class="h-4 w-4" />
        Tambah User
      </button>
    </div>

    <div v-if="loading" class="ca-card p-10 text-center">
      <Icon name="lucide:loader-2" class="mx-auto h-8 w-8 animate-spin text-[var(--ca-subtle)]" />
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b border-[color:var(--ca-border)]">
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--ca-muted)]">Nama</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--ca-muted)]">Email</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--ca-muted)]">Role</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--ca-muted)]">Status</th>
            <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--ca-muted)]">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in items" :key="u.id" class="border-b border-[color:var(--ca-border)] transition hover:bg-[var(--ca-panel-bg)]">
            <td class="px-4 py-3 text-sm font-medium text-[var(--ca-text)]">{{ u.full_name }}</td>
            <td class="px-4 py-3 text-sm text-[var(--ca-muted)]">{{ u.email }}</td>
            <td class="px-4 py-3">
              <span class="rounded-full px-2 py-0.5 text-[0.68rem] font-bold uppercase" :class="u.role === 'super_admin' ? 'bg-amber-500/10 ca-tone-gold' : 'bg-slate-500/10 text-[var(--ca-muted)]'">
                {{ u.role }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span :class="u.is_active ? 'text-emerald-400' : 'text-rose-400'" class="text-xs font-medium">
                {{ u.is_active ? 'Aktif' : 'Nonaktif' }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <div v-if="currentAdmin?.role === 'super_admin'" class="flex items-center justify-end gap-1">
                <button type="button" class="rounded-lg p-1.5 text-[var(--ca-muted)] hover:bg-[var(--ca-panel-bg-strong)]" title="Edit profil" @click="openEdit(u)">
                  <Icon name="lucide:edit-3" class="h-4 w-4" />
                </button>
                <button type="button" class="rounded-lg p-1.5 text-amber-400 hover:bg-amber-500/10" title="Ganti password" @click="openPasswordChange(u)">
                  <Icon name="lucide:key-round" class="h-4 w-4" />
                </button>
                <button v-if="u.id !== currentAdmin?.id" type="button" class="rounded-lg p-1.5 text-rose-400 hover:bg-rose-500/10" title="Hapus" @click="handleDelete(u)">
                  <Icon name="lucide:trash-2" class="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Form Modal -->
    <Teleport to="body">
      <div v-if="showFormModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" @click.self="showFormModal = false">
        <div class="ca-card w-full max-w-md p-6">
          <h3 class="font-display text-lg font-bold text-[var(--ca-text)]">{{ editingUser ? 'Edit User' : 'Tambah User' }}</h3>
          <form class="mt-4 space-y-3" @submit.prevent="handleSubmit">
            <BaseInput id="u-name" v-model="formData.full_name" label="Nama Lengkap" required />
            <BaseInput id="u-email" v-model="formData.email" label="Email" type="email" required />
            <SearchSelect
              id="u-role"
              v-model="formData.role"
              label="Role"
              :options="[
                { label: 'Admin', value: 'admin' },
                { label: 'Super Admin', value: 'super_admin' },
              ]"
            />
            <p v-if="error" class="text-sm text-rose-400">{{ error }}</p>
            <div class="flex justify-end gap-3 pt-2">
              <button type="button" class="ca-btn-secondary" @click="showFormModal = false">Batal</button>
              <button type="submit" class="ca-btn-primary" :disabled="saving">{{ saving ? 'Menyimpan...' : 'Simpan' }}</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirm -->
    <Teleport to="body">
      <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" @click.self="showDeleteConfirm = false">
        <div class="ca-card w-full max-w-md p-6">
          <h3 class="font-display text-lg font-bold text-[var(--ca-text)]">Hapus User?</h3>
          <p class="mt-2 text-sm text-[var(--ca-muted)]">Apakah yakin menghapus {{ deletingUser?.full_name }}?</p>
          <div class="mt-6 flex justify-end gap-3">
            <button type="button" class="ca-btn-secondary" @click="showDeleteConfirm = false">Batal</button>
            <button type="button" class="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600" @click="confirmDelete">Hapus</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Change Password Modal -->
    <Teleport to="body">
      <div v-if="showPasswordModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" @click.self="showPasswordModal = false">
        <div class="ca-card w-full max-w-md p-6">
          <h3 class="font-display text-lg font-bold text-[var(--ca-text)]">
            <Icon name="lucide:key-round" class="mr-2 inline h-5 w-5 text-amber-400" />
            Ganti Password
          </h3>
          <p class="mt-1 text-sm text-[var(--ca-muted)]">{{ passwordTarget?.full_name }} ({{ passwordTarget?.email }})</p>
          <form class="mt-4 space-y-3" @submit.prevent="handlePasswordChange">
            <BasePasswordInput id="pw-new" v-model="passwordForm.password" label="Password Baru" placeholder="Minimal 6 karakter" required />
            <BasePasswordInput id="pw-confirm" v-model="passwordForm.confirm_password" label="Konfirmasi Password" placeholder="Ulangi password baru" required />
            <p v-if="passwordError" class="text-sm text-rose-400">{{ passwordError }}</p>
            <p v-if="error" class="text-sm text-rose-400">{{ error }}</p>
            <div class="flex justify-end gap-3 pt-2">
              <button type="button" class="ca-btn-secondary" @click="showPasswordModal = false">Batal</button>
              <button type="submit" class="ca-btn-primary" :disabled="saving">{{ saving ? 'Menyimpan...' : 'Ganti Password' }}</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>
