<script setup>
defineProps({
  resource: Object
})
</script>

<template>
  <div class="card h-100 resource-card">
    <div class="card-body">

      <h5>{{ resource.title }}</h5>

      <span class="badge bg-success">

        {{ resource.type }}

      </span>

    </div>
  </div>
</template>

<style scoped>
.resource-card {
  width: 100%;
}
</style>