import React, { useState, useEffect } from 'react';
import { WorkloadClientAPI } from '@ms-fabric/workload-client';
import MarkdownIt from 'markdown-it';
import {
    makeStyles,
    shorthands,
    Button,
    Textarea,
    Toolbar,
    ToolbarButton,
    Title3
} from '@fluentui/react-components';
import {
    EditRegular,
    PreviewLinkRegular,
    SaveRegular
} from '@fluentui/react-icons';

const md = new MarkdownIt();

const useStyles = makeStyles({
    container: {
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        ...shorthands.padding('20px'),
        boxSizing: 'border-box',
    },
    toolbar: {
        marginBottom: '10px',
        borderBottom: '1px solid #ccc',
        paddingBottom: '10px',
    },
    editorContainer: {
        display: 'flex',
        flexGrow: 1,
        gap: '20px',
    },
    textarea: {
        flexGrow: 1,
        height: '100%',
        fontFamily: 'monospace',
        resize: 'none',
    },
    preview: {
        flexGrow: 1,
        height: '100%',
        ...shorthands.border('1px', 'solid', '#ccc'),
        ...shorthands.padding('10px'),
        overflowY: 'auto',
        backgroundColor: '#f9f9f9',
    }
});

interface MarkdownEditorProps {
    workloadClient: WorkloadClientAPI;
    itemObjectId: string;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ workloadClient, itemObjectId }) => {
    const styles = useStyles();
    const [content, setContent] = useState<string>('# Nuevo Documento\n\nEscribe tu markdown aquí...');
    const [isPreview, setIsPreview] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);

    useEffect(() => {
        // Load initial content (mock for now, will connect to backend later)
        console.log(`Loading item ${itemObjectId}`);
        // TODO: Call backend to get content
    }, [itemObjectId]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            console.log('Saving content:', content);
            // TODO: Call backend to save content
            // await workloadClient.callBackend...
        } catch (error) {
            console.error('Error saving:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.toolbar}>
                <Title3>Markdown Editor</Title3>
                <Toolbar>
                    <ToolbarButton
                        aria-label="Edit"
                        icon={<EditRegular />}
                        onClick={() => setIsPreview(false)}
                        appearance={!isPreview ? 'primary' : 'subtle'}
                    >
                        Editar
                    </ToolbarButton>
                    <ToolbarButton
                        aria-label="Preview"
                        icon={<PreviewLinkRegular />}
                        onClick={() => setIsPreview(true)}
                        appearance={isPreview ? 'primary' : 'subtle'}
                    >
                        Vista Previa
                    </ToolbarButton>
                    <ToolbarButton
                        aria-label="Save"
                        icon={<SaveRegular />}
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        Guardar
                    </ToolbarButton>
                </Toolbar>
            </div>

            <div className={styles.editorContainer}>
                {!isPreview ? (
                    <Textarea
                        className={styles.textarea}
                        value={content}
                        onChange={(e, data) => setContent(data.value)}
                        placeholder="Escribe tu markdown aquí..."
                    />
                ) : (
                    <div
                        className={styles.preview}
                        dangerouslySetInnerHTML={{ __html: md.render(content) }}
                    />
                )}
            </div>
        </div>
    );
};
