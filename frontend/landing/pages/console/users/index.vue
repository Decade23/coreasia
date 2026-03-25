<script setup lang="ts">
definePageMeta({ layout: 'console', middleware: 'console' })

const { items, loading, saving, error, totalItems, fetchUsers, createUser, updateUser, deleteUser } = useAdminUsers()
const { user: currentAdmin } = useAdminAuth()
const { can } = usePermissions()
const { tc } = useConsoleI18n()

const showFormModal = ref(false)
const showDeleteConfirm = ref(false)
const editingUser = ref<any>(null)
const deletingUser = ref<any>(null)

const formData = ref({ email: '', full_name: '', role: 'admin' })
const showPasswordModal = ref(false)
const passwordTarget = ref<any>(null)
const passwordForm = ref({ password: '', confirm_password: '' })
const passwordError = ref('')

const roleOptions = computed(() => [
  { label: tc('users.roleAdmin'), value: 'admin' },
  { label: tc('users.roleSuperAdmin'), value: 'super_admin' },
])

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
  const pwd = passwordForm.value.password
  if (pwd.length < 8 || !/[A-Z]/.test(pwd) || !/[a-z]/.test(pwd) || !/[0-9]/.test(pwd)) {
    passwordError.value = tc('users.passwordMin')
    return
  }
  if (passwordForm.value.password !== passwordForm.value.confirm_password) {
    passwordError.value = tc('users.passwordMismatch')
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

</script>

<template>
  <div>
    <ConsolePageHeader
      :kicker="tc('users.kicker')"
      icon="lucide:users"
      :title="tc('users.title')"
      :description="tc('users.description')"
    >
      <template #actions>
        <button v-if="can('users:create')" type="button" class="ca-btn-primary" @click="openCreate">
          <Icon name="lucide:plus" class="h-4 w-4" />
          {{ tc('users.add') }}
        </button>
      </template>
    </ConsolePageHeader>

    <div v-if="loading" class="ca-card p-10 text-center">
      <Icon name="lucide:loader-2" class="mx-auto h-8 w-8 animate-spin text-[var(--ca-subtle)]" />
    </div>

    <div v-else class="ca-console-table-wrap">
      <table class="ca-console-table">
        <thead class="sticky top-0 z-10">
          <tr>
            <th>{{ tc('users.fullName') }}</th>
            <th>{{ tc('users.email') }}</th>
            <th>{{ tc('users.role') }}</th>
            <th>{{ tc('common.status') }}</th>
            <th class="text-right">{{ tc('common.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in items" :key="u.id">
            <td class="font-medium text-[var(--ca-text)]">{{ u.full_name }}</td>
            <td class="text-[var(--ca-muted)]">{{ u.email }}</td>
            <td>
              <span class="rounded-full px-2 py-0.5 text-[0.68rem] font-bold uppercase" :class="u.role === 'super_admin' ? 'bg-amber-500/10 ca-tone-gold' : 'bg-slate-500/10 text-[var(--ca-muted)]'">
                {{ u.role }}
              </span>
            </td>
            <td>
              <span :class="u.is_active ? 'text-emerald-400' : 'text-rose-400'" class="text-xs font-medium">
                {{ u.is_active ? tc('users.active') : tc('users.inactive') }}
              </span>
            </td>
            <td class="text-right">
              <div v-if="can('users:update')" class="flex items-center justify-end gap-1">
                <CaTooltip :text="tc('users.editProfile')" position="bottom">
                  <button type="button" class="rounded-lg p-1.5 text-[var(--ca-muted)] hover:bg-[var(--ca-panel-bg-strong)]" @click="openEdit(u)">
                    <Icon name="lucide:edit-3" class="h-4 w-4" />
                  </button>
                </CaTooltip>
                <CaTooltip :text="tc('users.changePassword')" position="bottom">
                  <button type="button" class="rounded-lg p-1.5 text-amber-400 hover:bg-amber-500/10" @click="openPasswordChange(u)">
                    <Icon name="lucide:key-round" class="h-4 w-4" />
                  </button>
                </CaTooltip>
                <CaTooltip v-if="u.id !== currentAdmin?.id" :text="tc('common.delete')" position="bottom">
                  <button type="button" class="rounded-lg p-1.5 text-rose-400 hover:bg-rose-500/10" @click="handleDelete(u)">
                    <Icon name="lucide:trash-2" class="h-4 w-4" />
                  </button>
                </CaTooltip>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Form Modal -->
    <Teleport to="body">
      <div v-if="showFormModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" @click.self="showFormModal = false">
        <div class="ca-console-dialog w-full max-w-md p-6">
          <h3 class="font-display text-lg font-bold text-[var(--ca-text)]">{{ editingUser ? tc('users.formEditTitle') : tc('users.formCreateTitle') }}</h3>
          <form class="mt-4 space-y-3" @submit.prevent="handleSubmit">
            <BaseInput id="u-name" v-model="formData.full_name" :label="tc('users.fullName')" required />
            <BaseInput id="u-email" v-model="formData.email" :label="tc('users.email')" type="email" required />
            <SearchSelect
              id="u-role"
              v-model="formData.role"
              :label="tc('users.role')"
              :options="roleOptions"
            />
            <p v-if="error" class="text-sm text-rose-400">{{ error }}</p>
            <div class="flex justify-end gap-3 pt-2">
              <button type="button" class="ca-btn-secondary" @click="showFormModal = false">{{ tc('common.cancel') }}</button>
              <button type="submit" class="ca-btn-primary" :disabled="saving">{{ saving ? tc('common.processing') : tc('common.save') }}</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirm -->
    <Teleport to="body">
      <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" @click.self="showDeleteConfirm = false">
        <div class="ca-console-dialog w-full max-w-md p-6">
          <h3 class="font-display text-lg font-bold text-[var(--ca-text)]">{{ tc('users.deleteTitle') }}</h3>
          <p class="mt-2 text-sm text-[var(--ca-muted)]">{{ tc('users.deleteDescription', { name: deletingUser?.full_name || '-' }) }}</p>
          <div class="mt-6 flex justify-end gap-3">
            <button type="button" class="ca-btn-secondary" @click="showDeleteConfirm = false">{{ tc('common.cancel') }}</button>
            <button type="button" class="ca-btn-danger !px-4 !py-2.5" @click="confirmDelete">{{ tc('common.delete') }}</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Change Password Modal -->
    <Teleport to="body">
      <div v-if="showPasswordModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" @click.self="showPasswordModal = false">
        <div class="ca-console-dialog w-full max-w-md p-6">
          <h3 class="font-display text-lg font-bold text-[var(--ca-text)]">
            <Icon name="lucide:key-round" class="mr-2 inline h-5 w-5 text-amber-400" />
            {{ tc('users.passwordTitle') }}
          </h3>
          <p class="mt-1 text-sm text-[var(--ca-muted)]">{{ tc('users.passwordDescription', { name: passwordTarget?.full_name || '-', email: passwordTarget?.email || '-' }) }}</p>
          <form class="mt-4 space-y-3" @submit.prevent="handlePasswordChange">
            <BasePasswordInput id="pw-new" v-model="passwordForm.password" :label="tc('users.newPassword')" :placeholder="tc('users.passwordMin')" required />
            <BasePasswordInput id="pw-confirm" v-model="passwordForm.confirm_password" :label="tc('users.confirmPassword')" :placeholder="tc('users.confirmPassword')" required />
            <p v-if="passwordError" class="text-sm text-rose-400">{{ passwordError }}</p>
            <p v-if="error" class="text-sm text-rose-400">{{ error }}</p>
            <div class="flex justify-end gap-3 pt-2">
              <button type="button" class="ca-btn-secondary" @click="showPasswordModal = false">{{ tc('common.cancel') }}</button>
              <button type="submit" class="ca-btn-primary" :disabled="saving">{{ saving ? tc('common.processing') : tc('users.savePassword') }}</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>
