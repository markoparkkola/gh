<template>
    <div class="multi-selector">
        <div v-if="mode==='display'">
            <div class="multi-selector-display" @click="mode='edit'">
                <span v-if="!selected.length">Nothing selected</span>
                <span v-if="selected.length === 1"><i>{{selected[0][displayMember]}}</i> selected</span>
                <span v-if="selected.length > 1"><i>{{selected[0][displayMember]}}</i> + {{(selected.length - 1)}} selected</span>
            </div>
        </div>
        <div v-if="mode==='edit'">
            <div class="multi-selector-header" @resize="setSize">
                <input type="text" v-model="filter" @keydown="keyDown" @focus="showSelectionList=true" @blur="hideSelectionList" v-if="items.length" />
                <span class="empty-list" v-if="!items.length">No items</span>
                <button type="button" @click="mode='display';$emit('selected', selected)">*</button>
            </div>
            <div class="multi-selector-selection" :style="{width: elemWidth}" v-if="selected.length">
                <span v-for="(item, index) in selected" :key="item[valueMember]" @click="removeSelection(index)">{{item[displayMember]}}</span>
            </div>
            <div class="multi-selector-results" :style="{width: elemWidth}" v-if="items.length && showSelectionList">
                <span v-for="(item, index) in filteredItems" :key="item[valueMember]" :class="{selected: index==selectionIndex}" @click="addSelection(index)" @mouseover="selectionIndex=index">{{item[displayMember]}}</span>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'multi-selector',
    props: {
        source: Array,
        valueMember: String,
        displayMember: String
    },
    data: function() {
        return {
            mode: 'display',
            items: this.source,
            selected: [],
            filter: '',
            showSelectionList: false,
            selectionIndex: null,
            elemWidth: '100%'
        };
    },
    methods: {
        keyDown: function (event) {
            const scrollToView = function () {
                const element = document.querySelector('.multi-selector-results span.selected');
                if (element)
                    element.scrollIntoViewIfNeeded();
            };

            if (event.which === 40 && this.selectionIndex < this.filteredItems.length - 1) {
                this.selectionIndex++;
                this.$nextTick(scrollToView);
            }
            else if (event.which === 38 && this.selectionIndex > 0) {
                this.selectionIndex--;
                this.$nextTick(scrollToView);
            }
            else if (event.which === 27) {
                this.filter = null;
                event.srcElement.blur();
                event.stopPropagation();
                return false;
            }
            else if (event.which === 13) {
                this.addSelection(this.selectionIndex);
                this.filter = null;
                event.srcElement.blur();
                event.stopPropagation();
                return false;
            }
        },
        addSelection: function (index) {
            const selected = this.filteredItems[index];
            const realIndex = this.items.indexOf(selected);
            const removed = this.items.splice(realIndex, 1)[0];
            this.selected.push(removed);
        },
        removeSelection: function (index) {
            this.items.push(this.selected.splice(index, 1)[0]);
        },
        hideSelectionList: function () {
            setTimeout(() => {
                this.showSelectionList = false;
            }, 250);
        },
        setSize: function(event) {
            this.elemWidth = event.srcElement.clientWidth.toString() + 'px';
        }
    },
    computed: {
        sortedItems: function () {
            return [...this.items].sort((a, b) => a[this.displayMember].localeCompare(b[this.displayMember]));
        },
        filteredItems: function() {
            return (!this.filter || !this.filter.length) ? this.sortedItems : this.sortedItems.filter(x => x[this.displayMember].toLocaleLowerCase().indexOf(this.filter.toLocaleLowerCase()) === 0);
        }
    },
    watch: {
        mode: function (newValue) {
            if (newValue === 'edit' && !this.selected.length) {
                this.$nextTick(() => {
                    let element = document.querySelector('.multi-selector input');
                    if (element) {
                        element.focus();
                        this.elemWidth = element.parentElement.clientWidth.toString() + 'px';
                    }
                });
            }
        },
        source: function (newValue) {
            this.items = newValue;
        }
    }
}
</script>

<style scoped>
    .multi-selector {
        position: relative;
        width: 100%;
    }

    .multi-selector-display {
        display: flex;
        border: 1px solid black;
        border-radius: 3px;
        cursor: pointer;
        max-height: 30px;
        overflow: hidden;
        font-weight: normal;
        padding-left: 3px;
    }

    .empty-list {
        font-weight: normal;
        display: block;
        width: 100%;
    }

    .multi-selector-header {
        display: flex;
    }

        .multi-selector-header input {
            width: 100%;
            border-radius: 3px;
        }

        .multi-selector-header button {
            border-radius: 3px;
            width: 18px;
            padding: 0;
        }

    .multi-selector-selection {
        position: fixed;
        overflow-x: hidden;
        overflow-y: auto;
        max-height: 15rem;
        border: 1px solid black;
        background-color: white;
        z-index: 9998;
    }

        .multi-selector-selection span {
            border: 1px solid gray;
            border-radius: 3px;
            background-color: steelblue;
            color: white;
            margin: 3px;
        }

            .multi-selector-selection span:hover {
                cursor: pointer;
                background-color: red;
            }

    .multi-selector-results {
        position: fixed;
        overflow-x: hidden;
        overflow-y: auto;
        max-height: 15rem;
        text-align: left;
        padding-left: 3px;
        border: 1px solid black;
        background-color: white;
        z-index: 9999;
    }

    .multi-selector-results span {
        display: block;
        background-color: white;
        z-index: 9998;
    }

        .multi-selector-results span:hover {
            cursor: pointer;
            background-color: lightblue;
        }

        .multi-selector-results span.selected {
            background-color: blue;
            color: white;
        }
</style>