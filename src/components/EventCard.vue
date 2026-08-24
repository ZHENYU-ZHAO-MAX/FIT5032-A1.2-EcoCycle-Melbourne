<script setup>
defineProps({
  event: Object
})
</script>

<template>
  <div class="card h-100">
    <div class="card-body">
      <h5>{{ event.title }}</h5>

      <p>{{ event.date }}</p>

      <p>{{ event.location }}</p>
    </div>
  </div>
</template>