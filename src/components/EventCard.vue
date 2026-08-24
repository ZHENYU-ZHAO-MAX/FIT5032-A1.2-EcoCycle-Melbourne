<script setup>
defineProps({
  event: Object
})
</script>

<template>
  <div class="card h-100 shadow-sm event-card">
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

    </div>
  </div>
</template>

<style scoped>
.event-card {
  width: 100%;
}
</style>