<script setup>
defineProps({
  resource: Object
})
</script>

<template>
  <div class="card h-100">
    <div class="card-body">

      <h5>{{ resource.title }}</h5>

      <span class="badge bg-success">

        {{ resource.type }}

      </span>

    </div>
  </div>
</template>