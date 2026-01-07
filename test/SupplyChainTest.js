const SupplyChain = artifacts.require("SupplyChain");

contract("SupplyChain - Shipment Notes", (accounts) => {
    const [owner, distributor, retailer] = accounts;
    let supplyChainInstance;

    // ShipmentStatus enum values
    const ShipmentStatus = {
        Pending: 0,
        InTransit: 1,
        Delivered: 2
    };

    beforeEach(async () => {
        // Deploy a fresh contract before each test
        supplyChainInstance = await SupplyChain.new({ from: owner });

        // Register distributor
        await supplyChainInstance.addDistributor(
            distributor,
            "Test Distributor",
            "Test Location",
            { from: owner }
        );

        // Add a medicine and move it through the supply chain
        await supplyChainInstance.addMedicine("Test Medicine", "Test Description", { from: owner });

        // Register supplier and supply raw materials
        await supplyChainInstance.addSupplier(owner, "Test Supplier", "Supplier Location", { from: owner });
        await supplyChainInstance.supplyRawMaterials(1, { from: owner });

        // Register manufacturer and manufacture
        await supplyChainInstance.addManufacturer(owner, "Test Manufacturer", "Manufacturer Location", { from: owner });
        await supplyChainInstance.manufactureMedicine(1, { from: owner });

        // Distribute (so distributor can create shipment)
        await supplyChainInstance.addDistributor(owner, "Owner Distributor", "Owner Location", { from: owner });
        await supplyChainInstance.distributeMedicine(1, { from: owner });
    });

    describe("updateShipmentStatusWithNote", () => {
        const trackingId = "TRACK-001";

        beforeEach(async () => {
            // Create a shipment before each test in this describe block
            await supplyChainInstance.createShipment(1, retailer, trackingId, { from: owner });
        });

        it("should update shipment status and store a note", async () => {
            const note = "Package picked up from warehouse";

            // Update status with note
            const tx = await supplyChainInstance.updateShipmentStatusWithNote(
                trackingId,
                ShipmentStatus.InTransit,
                note,
                { from: owner }
            );

            // Verify the shipment status was updated
            const shipment = await supplyChainInstance.shipments(trackingId);
            assert.equal(
                shipment.status.toNumber(),
                ShipmentStatus.InTransit,
                "Shipment status should be InTransit"
            );

            // Verify the event was emitted
            assert.equal(tx.logs.length, 1, "Should emit one event");
            assert.equal(tx.logs[0].event, "ShipmentUpdatedWithNote", "Event name should be ShipmentUpdatedWithNote");
            assert.equal(tx.logs[0].args.trackingId, trackingId, "Event trackingId should match");
            assert.equal(tx.logs[0].args.status.toNumber(), ShipmentStatus.InTransit, "Event status should be InTransit");
            assert.equal(tx.logs[0].args.note, note, "Event note should match");
            assert.equal(tx.logs[0].args.updatedBy, owner, "Event updatedBy should be owner");
        });

        it("should store multiple notes in history", async () => {
            const note1 = "Package picked up from warehouse";
            const note2 = "Package in transit to destination";
            const note3 = "Package delivered successfully";

            // Add multiple notes
            await supplyChainInstance.updateShipmentStatusWithNote(
                trackingId,
                ShipmentStatus.InTransit,
                note1,
                { from: owner }
            );

            await supplyChainInstance.updateShipmentStatusWithNote(
                trackingId,
                ShipmentStatus.InTransit,
                note2,
                { from: owner }
            );

            await supplyChainInstance.updateShipmentStatusWithNote(
                trackingId,
                ShipmentStatus.Delivered,
                note3,
                { from: owner }
            );

            // Get all notes
            const notes = await supplyChainInstance.getShipmentNotes(trackingId);

            // Verify notes count
            assert.equal(notes.length, 3, "Should have 3 notes in history");

            // Verify first note
            assert.equal(Number(notes[0].status), ShipmentStatus.InTransit, "First note status should be InTransit");
            assert.equal(notes[0].note, note1, "First note text should match");
            assert.equal(notes[0].updatedBy, owner, "First note updatedBy should be owner");

            // Verify second note
            assert.equal(Number(notes[1].status), ShipmentStatus.InTransit, "Second note status should be InTransit");
            assert.equal(notes[1].note, note2, "Second note text should match");

            // Verify third note
            assert.equal(Number(notes[2].status), ShipmentStatus.Delivered, "Third note status should be Delivered");
            assert.equal(notes[2].note, note3, "Third note text should match");
        });

        it("should store timestamp for each note", async () => {
            const note = "Test note with timestamp";

            // Get block timestamp before transaction
            const txResult = await supplyChainInstance.updateShipmentStatusWithNote(
                trackingId,
                ShipmentStatus.InTransit,
                note,
                { from: owner }
            );

            // Get the block to check timestamp
            const block = await web3.eth.getBlock(txResult.receipt.blockNumber);

            // Get notes and verify timestamp
            const notes = await supplyChainInstance.getShipmentNotes(trackingId);
            assert.equal(
                Number(notes[0].timestamp),
                Number(block.timestamp),
                "Note timestamp should match block timestamp"
            );
        });

        it("should revert when shipment does not exist", async () => {
            try {
                await supplyChainInstance.updateShipmentStatusWithNote(
                    "INVALID-TRACKING-ID",
                    ShipmentStatus.InTransit,
                    "Some note",
                    { from: owner }
                );
                assert.fail("Should have reverted");
            } catch (error) {
                assert.include(error.message, "Shipment not found", "Error message should contain 'Shipment not found'");
            }
        });
    });

    describe("getShipmentNotes", () => {
        const trackingId = "TRACK-002";

        it("should return empty array for shipment with no notes", async () => {
            // Create a shipment
            await supplyChainInstance.createShipment(1, retailer, trackingId, { from: owner });

            // Get notes (should be empty)
            const notes = await supplyChainInstance.getShipmentNotes(trackingId);
            assert.equal(notes.length, 0, "Should have no notes initially");
        });

        it("should revert when shipment does not exist", async () => {
            try {
                await supplyChainInstance.getShipmentNotes("NON-EXISTENT-TRACKING");
                assert.fail("Should have reverted");
            } catch (error) {
                assert.include(error.message, "Shipment not found", "Error message should contain 'Shipment not found'");
            }
        });

        it("should return notes with correct structure", async () => {
            // Create a shipment
            await supplyChainInstance.createShipment(1, retailer, trackingId, { from: owner });

            const testNote = "Checking note structure";

            // Add a note
            await supplyChainInstance.updateShipmentStatusWithNote(
                trackingId,
                ShipmentStatus.InTransit,
                testNote,
                { from: owner }
            );

            // Get notes
            const notes = await supplyChainInstance.getShipmentNotes(trackingId);

            // Verify structure has all required fields
            assert.exists(notes[0].status, "Note should have status field");
            assert.exists(notes[0].note, "Note should have note field");
            assert.exists(notes[0].timestamp, "Note should have timestamp field");
            assert.exists(notes[0].updatedBy, "Note should have updatedBy field");
        });
    });
});
