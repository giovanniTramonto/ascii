<template>
<div class="wrapper">
  <form @submit.prevent="onSubmit" class="form" enctype="multipart/form-data">
    <label class="label label--1">
      <span class="description">Select a plain text file</span>
      <input @change="onChangeFile" type="file" />
    </label>
    <label class="label label--2">
      <span class="description">Choose interval</span>
      <input v-model="form.interval" type="range" step="1" min="0" max="5000" />
      <span>{{ form.interval }} ms</span>
    </label>
    <input value="Print" type="submit" class="submit" :disabled=isSubmitting>
  </form>

  <div class="notifications">
    <div v-if="errors.length > 0" class="errors">
      <div v-for="error in errors">{{ error }}</div>
    </div>
    <div v-if="isPrinting" class="progress">Progress {{ printingProgress }}%</div>
  </div>

  <div v-if="textLines.length > 0" class="output">
    <div class="output-inner">
      <span v-for="line in textLines">{{ line }}</span>
    </div>
  </div>
</div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue';

enum PrintStatus {
  Processing = 'processing',
  Complete = 'complete'
}

interface PrintMessage {
  progress: number,
  line: string,
  status: PrintStatus
}

interface PrintForm {
  interval: number,
  file: File | null
}

const socketProtocol : string = Date.now().toString()
const socket = new WebSocket(__WSS_PATH__, [socketProtocol]);
const textLines = ref<string[]>([]);
const errors = ref<string[]>([]);
const form = reactive<PrintForm>({
  interval: 100,
  file: null
});
const printingProgress = ref<number | null>(null);
const isSubmitting = ref(false);
const isPrinting = computed(() => printingProgress.value && form.interval > 0);

socket.addEventListener('message', (message : MessageEvent) => {
  const { progress, line, status } : PrintMessage = JSON.parse(message.data);
  printingProgress.value = progress;
  textLines.value.push(line);
  if (status === PrintStatus.Complete) {
    printingProgress.value = null
  }
});

function onChangeFile(event : Event) : void {
  const { files } = event.target as HTMLInputElement;
  if (files?.[0]) {
    form.file = files[0];
  }
}

async function onSubmit() : Promise<void> {
  reset();

  if (form.file) {
    isSubmitting.value = true;
    const formData = new FormData();
    for (const [key, value] of Object.entries(form)) {
      formData.set(key, value as string | Blob);
    }
    formData.set('socketProtocol', socketProtocol);
    const response = await fetch(__API_PATH__, { method: 'POST', body: formData });
    if (!response.ok) {
      const text = await response.text?.();
      addError(text || 'SOMETHING WENT WRONG');
    }
    isSubmitting.value = false;
  } else {
    addError('SELECT A FILE');
  }
}

function addError(message : string) :void {
  errors.value.push(message);
}

function reset() : void {
  textLines.value.length = 0;
  errors.value.length = 0;
}
</script>

<style scoped>
.submit {
  border: 1px solid var(--clr-yellow);
  padding: 0.5rem;
  color: var(--clr-yellow);
  background: none;
  cursor: pointer;
  margin: 0 1rem;
}
.submit:not[disabled]:hover,
.submit:not[disabled]:active {
  background: var(--clr-yellow);
  color: var(--clr-black);
}
.submit[disabled] {
  opacity: 0.5;
}

@media screen and (min-width: 960px) {
  .submit {
    margin-left: auto;
  }
}

.description {
  display: inline-block;
  color: var(--clr-yellow);
  padding: 0.5rem 1rem;
}

.errors {
  background: var(--clr-yellow);
  color: var(--clr-black);
  padding: 1rem;
}

.form {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 0;
}

@media screen and (min-width: 960px) {
  .form {
    flex-direction: row;
  }
}

.label {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  user-select: none;
}
.label--1 {
  justify-self: start;
}
.label--2 {
  justify-self: center;
}

.notifications {
  min-height: 4rem;
}

.output {
  flex: 1;
  display: flex;
  justify-content: center;
}
.output-inner {
  white-space: pre;
  user-select: none;
}
.output-inner span {
  display: block;
}

.progress {
  padding: 0 1rem;
}

.wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
}
</style>