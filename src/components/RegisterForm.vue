<script setup>

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

emit('register',{

username:username.value,

password:password.value,

role:role.value

})

}

</script>

<template>
<button
class="btn btn-primary"
@click="submitRegister"
>

Register

</button>
</template>