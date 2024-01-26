class Variants {

    constructor({graphModel, getNodeScope}) {
        this.getNodeScope = getNodeScope;

        if(graphModel) {
            this.graphModel = graphModel;
            graphModel.on('variantUpdated', variant => this.onVariantUpdated(variant));
        }
    }

    getVariant(typename, name) {
        if(!this.graphModel) return undefined;
        
        return this.graphModel.getVariant(typename, name);
    }

    onVariantUpdated(variant) {
        const nodeScope = this.getNodeScope();
        if(!nodeScope) return;

        //get all nodes with the type the variant applies to
        const nodes = nodeScope.getNodesWithTypeRecursive(variant.typename);

        //and filter for the ones using the updated variant
        const nodesWithVariant = nodes.filter(node => {

            //if a variant has been set during runtime, it'll override the value from the model
            if(node.variant) return node.variant.name === variant.name;

            //otherwise check the model (which always matches the editor)
            return node.model && node.model.variant === variant.name;
        });

        //and re-apply the variant
        for(const node of nodesWithVariant) {
            node.setVariant(variant);
        }
    }
}

module.exports = Variants;