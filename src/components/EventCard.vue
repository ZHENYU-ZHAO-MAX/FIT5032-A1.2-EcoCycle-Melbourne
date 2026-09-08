<script setup>

import { ref, computed } from 'vue'

const props = defineProps({
  event: Object
})

const emit = defineEmits([
  'register-event',
  'submit-rating'
])

const selectedRating = ref('')

const averageRating = computed(() => {

  const ratings = props.event.ratings

  return (
    ratings.reduce(
      (a,b) => a+b,
      0
    ) / ratings.length

  ).toFixed(1)

})

</script>

<template>
  <div
class="
card
shadow-sm
border-success
h-100
"
>
    <div class="card-body">

      <h5 class="card-title">
        {{ event.title }}
      </h5>

      <p>
        {{ event.date }}
      </p>

      <p>
        {{ event.location }}
      </p>

      <button
v-if="!event.registered"
class="btn btn-success"
@click="
$emit(
'register-event',
event.id
)
"
>
Register
</button>

<span
v-else
class="badge bg-success"
>
✅ Registered
</span>

<hr>

<p>

⭐ Average Rating:

{{ averageRating }}/5

</p>

<select
  class="form-select mb-2"
  v-model="selectedRating"
>

  <option value="">
    Select Rating
  </option>

  <option value="1">1 Star</option>
  <option value="2">2 Stars</option>
  <option value="3">3 Stars</option>
  <option value="4">4 Stars</option>
  <option value="5">5 Stars</option>

</select>

<button
  class="btn btn-warning"
  @click="
    $emit(
      'submit-rating',
      {
        eventId:event.id,
        rating:selectedRating
      }
    )
  "
>

Submit Rating

</button>


    </div>
  </div>
</template>

<style scoped>
.event-card {
  width: 100%;
}
</style>