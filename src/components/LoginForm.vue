<script setup>

import { ref } from 'vue'

const emit = defineEmits([
  'login'
])

const username = ref('')
const password = ref('')

const login = () => {

  emit(
    'login',
    {
      username: username.value,
      password: password.value
    }
  )

}

</script>

<template>

<div class="card shadow-sm p-4">

  <h3 class="text-primary mb-3">
    Login
  </h3>

  <div class="mb-3">

    <label>
      Username
    </label>

    <input
      class="form-control"
      v-model="username"
    />

  </div>

  <div class="mb-3">

    <label>
      Password
    </label>

    <input
      type="password"
      class="form-control"
      v-model="password"
    />

  </div>

  <button
    class="btn btn-primary w-100"
    @click="login"
  >
    Login
  </button>

</div>

</template>