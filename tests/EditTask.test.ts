/**
 * @jest-environment jsdom
 */
import { fireEvent, render } from '@testing-library/svelte';
import { describe, expect, it } from '@jest/globals';
import moment from 'moment';
import { verify } from 'approvals/lib/Providers/Jest/JestApprovals';
import { EMPTY } from 'approvals/lib/Utilities/Printers';
import { taskFromLine } from '../src/Commands/CreateOrEditTaskParser';
import type { Task } from '../src/Task';
import EditTask from '../src/ui/EditTask.svelte';
import { Status } from '../src/Status';
import { DateFallback } from '../src/DateFallback';
import { GlobalFilter } from '../src/Config/GlobalFilter';
import { updateSettings } from '../src/Config/Settings';

window.moment = moment;
const statusOptions: Status[] = [Status.DONE, Status.TODO];

const EMPTY_ENTRY = EMPTY[0];

export async function printCombinationsAsync<T1, T2, T3, T4, T5, T6, T7, T8, T9>(
    func: <T1, T2, T3, T4, T5, T6, T7, T8, T9>(
        t1: T1,
        t2: T2,
        t3: T3,
        t4: T4,
        t5: T5,
        t6: T6,
        t7: T7,
        t8: T8,
        t9: T9,
    ) => any,
    params1: T1[],
    params2: T2[],
    params3: T3[],
    params4: T4[],
    params5: T5[],
    params6: T6[],
    params7: T7[],
    params8: T8[],
    params9: T9[],
): Promise<string> {
    let text = '';
    for (const p1 of params1) {
        for (const p2 of params2) {
            for (const p3 of params3) {
                for (const p4 of params4) {
                    for (const p5 of params5) {
                        for (const p6 of params6) {
                            for (const p7 of params7) {
                                for (const p8 of params8) {
                                    for (const p9 of params9) {
                                        let output;
                                        try {
                                            output = func(p1, p2, p3, p4, p5, p6, p7, p8, p9);
                                        } catch (e) {
                                            output = `${e}`;
                                        }
                                        const parameters = [p1, p2, p3, p4, p5, p6, p7, p8, p9].filter(
                                            (p) => p !== EMPTY_ENTRY,
                                        );

                                        text += `[${parameters}] => ${await output}\n`;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return text;
}

export async function verifyAllCombinations2Async<T1, T2>(func: (t1: T1, t2: T2) => any, params1: T1[], params2: T2[]) {
    // @ts-ignore
    verify(
        await printCombinationsAsync(
            // @ts-ignore
            async (t1: T1, t2: T2, _t3: any, _t4: any, _t5: any, _t6: any, _t7: any, _t8: any, _t9: any) =>
                await func(t1, t2),
            params1,
            params2,
            EMPTY,
            EMPTY,
            EMPTY,
            EMPTY,
            EMPTY,
            EMPTY,
            EMPTY,
        ),
    );
}

describe('Task rendering', () => {
    afterEach(() => {
        GlobalFilter.reset();
    });

    function testDescriptionRender(taskDescription: string, expectedDescription: string) {
        const task = taskFromLine({ line: `- [ ] ${taskDescription}`, path: '' });

        const onSubmit = (_: Task[]): void => {};
        const { container } = render(EditTask, { task, statusOptions, onSubmit });
        expect(() => container).toBeTruthy();
        const renderedDescription = container.ownerDocument.getElementById('description') as HTMLInputElement;
        expect(() => renderedDescription).toBeTruthy();
        expect(renderedDescription!.value).toEqual(expectedDescription);
    }

    it('should display task description (empty Global Filter)', () => {
        testDescriptionRender('important thing #todo', 'important thing #todo');
    });

    it('should display task description without non-tag Global Filter)', () => {
        GlobalFilter.set('filter');
        testDescriptionRender('filter important thing', 'important thing');
    });

    it('should display task description with complex non-tag Global Filter)', () => {
        GlobalFilter.set('filter');
        // This behavior is incosistent with Obsidian's tag definition which includes nested tags
        testDescriptionRender('filter/important thing', 'filter/important thing');
    });

    it('should display task description without tag-like Global Filter', () => {
        GlobalFilter.set('#todo');
        testDescriptionRender('#todo another plan', 'another plan');
    });

    it('should display task description with complex tag-like Global Filter', () => {
        GlobalFilter.set('#todo');
        // This behavior is incosistent with Obsidian's tag definition which includes nested tags
        testDescriptionRender('#todo/important another plan', '#todo/important another plan');
    });
});

describe('Task editing', () => {
    afterEach(() => {
        GlobalFilter.reset();
    });

    async function editTask(taskDescription: string, newDescription: string) {
        const task = taskFromLine({ line: `- [ ] ${taskDescription}`, path: '' });

        let resolvePromise: (input: string) => void;
        const waitForClose = new Promise<string>((resolve, _) => {
            resolvePromise = resolve;
        });
        const onSubmit = (updatedTasks: Task[]): void => {
            const serializedTask = DateFallback.removeInferredStatusIfNeeded(task, updatedTasks)
                .map((task: Task) => task.toFileLineString())
                .join('\n');
            resolvePromise(serializedTask);
        };

        const result = render(EditTask, { task, statusOptions, onSubmit });
        const { container } = result;
        expect(() => container).toBeTruthy();

        const description = container.ownerDocument.getElementById('description') as HTMLInputElement;
        expect(description).toBeTruthy();
        const submit = result.getByText('Apply') as HTMLButtonElement;
        expect(submit).toBeTruthy();

        await fireEvent.input(description, { target: { value: newDescription } });
        submit.click();
        const editedTask = await waitForClose;
        return editedTask;
    }

    async function testDescriptionEdit(taskDescription: string, newDescription: string, expectedDescription: string) {
        const editedTask = await editTask(taskDescription, newDescription);
        expect(editedTask).toEqual(`- [ ] ${expectedDescription}`);
    }

    it('should keep task description if it was not edited (Empty Global Filter)', async () => {
        const description = 'simple task #remember';
        await testDescriptionEdit(description, description, description);
    });

    it('should change task description if it was edited (Empty Global Filter)', async () => {
        await testDescriptionEdit('simple task #remember', 'another', 'another');
    });

    it('should not change the description if the task was not edited and keep Global Filter', async () => {
        const globalFilter = '#remember';
        const description = 'simple task';
        GlobalFilter.set(globalFilter);
        await testDescriptionEdit(`${globalFilter} ${description}`, description, `${globalFilter} ${description}`);
    });

    it('should change the description if the task was edited and keep Global Filter', async () => {
        const globalFilter = '#remember';
        const oldDescription = 'simple task';
        const newDescription = 'new plan';
        GlobalFilter.set(globalFilter);
        await testDescriptionEdit(
            `${globalFilter} ${oldDescription}`,
            newDescription,
            `${globalFilter} ${newDescription}`,
        );
    });

    it('issue 2112', async () => {
        const globalFilter = '#task';

        const oldDescription = 'simple task';
        verifyAllCombinations2Async(
            async (globalFilter, setCreatedDate) => {
                GlobalFilter.set(globalFilter);
                updateSettings({ setCreatedDate });
                return await editTask(oldDescription, oldDescription);
            },
            [globalFilter],
            [true],
        );
    });
});
