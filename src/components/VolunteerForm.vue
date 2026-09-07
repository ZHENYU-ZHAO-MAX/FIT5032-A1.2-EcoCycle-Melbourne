<script setup>
defineProps({
events:Array
})
import { ref } from 'vue'

const name = ref('')
const email = ref('')
const reason = ref('')

const nameError = ref('')
const emailError = ref('')
const reasonError = ref('')

const validateName = () => {

  if (!name.value.trim()) {

    nameError.value =
      'Name is required'

  } else {

    nameError.value = ''

  }

}

const validateEmail = () => {

  const regex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!regex.test(email.value)) {

    emailError.value =
      'Please enter a valid email'

  } else {

    emailError.value = ''

  }

}

const validateReason = () => {

  if (reason.value.length < 20) {

    reasonError.value =
      'Minimum 20 characters required'

  } else {

    reasonError.value = ''

  }

}

const selectedEvent = ref('')

</script>

<template>

<div class="card p-4">

<h3>Volunteer Registration</h3>

<div class="mb-3">

<label>Name</label>

<input
class="form-control"
v-model="name"
@blur="validateName"
/>

<div class="text-danger">
{{ nameError }}
</div>

</div>

<div class="mb-3">

<label>Email</label>

<input
class="form-control"
v-model="email"
@blur="validateEmail"
/>

<div class="text-danger">
{{ emailError }}
</div>

</div>

<div class="mb-3">

<label>Reason</label>

<textarea
class="form-control"
v-model="reason"
@blur="validateReason"
></textarea>

<div class="text-danger">
{{ reasonError }}
</div>

</div>

<div class="mb-3">

<label>
Select Event
</label>

<select
class="form-select"
v-model="selectedEvent"
>

<option disabled value="">
Please Select
</option>

<option
v-for="
event
in
events
"
:key="event.id"
:value="event.title"
>

{{ event.title }}

</option>

</select>

</div>

</div>

</template>