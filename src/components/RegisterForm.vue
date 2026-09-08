<script setup>

import {
  sanitizeInput
}
from '../utils/security'
import { ref } from 'vue'

const emit =
defineEmits(['register'])

const username =
ref('')

const password =
ref('')

const role =
ref('Volunteer')

const submitRegister = () => {

console.log("Register clicked")

console.log({
username:username.value,
password:password.value,
role:role.value
})

username.value =
sanitizeInput(
  username.value
)

if (
  username.value.includes('<script') ||
  username.value.includes('</script')
){

  alert(
    'Potentially unsafe input detected.'
  )

  return

}


if(
  password.value.length < 8
){

  alert(
    'Password must be at least 8 characters'
  )

  return

}



emit('register',{

username:username.value,

password:password.value,

role:role.value

})

}

</script>

<template>

<div class="card shadow-sm p-4">

  <h3 class="text-success mb-3">

    Register

  </h3>

  <div class="mb-3">

    <label class="form-label">

      Username

    </label>

    <input
      class="form-control"
      v-model="username"
    />

  </div>

  <div class="mb-3">

    <label class="form-label">

      Password

    </label>

    <input
      type="password"
      class="form-control"
      v-model="password"
    />

  </div>

  <div class="mb-3">

    <label class="form-label">

      Role

    </label>

    <select
      class="form-select"
      v-model="role"
    >

      <option value="Volunteer">

        Volunteer

      </option>

      <option value="Admin">

        Admin

      </option>

    </select>

  </div>

  <button
    class="btn btn-success w-100"
    @click="submitRegister"
  >

    Register

  </button>

</div>

</template>